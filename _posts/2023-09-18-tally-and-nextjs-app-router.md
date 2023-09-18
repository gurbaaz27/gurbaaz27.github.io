---

layout: post
title: "Integrating Tally forms with Next.js App Router"
subtitle: "Typeform killer? Yes."
thumbnail-img: /assets/img/blogs/tally.png
share-img: /assets/img/blogs/tally.png
tags: [nextjs, tally, api, integration, tech]
minutes_to_read: 9
---

After almost 3 months of successful launch of [PuzzledQuant](https://puzzledquant.com), an online learning platform to help you enhance your quant skills, we started thinking more ways to connect to our audience, and understand the demographics. As a first step, this meant collecting basic user needs, which would ideally involve a popup form as soon as the user lands our page. <span class="mark">We only had 2 basic needs, a sleek UI, and ability to populate our existing postgres database with user responses without any manual intervention.</span>

As a full-time engineer nowadays, it becomes hard to take out time to work on side ventures, let alone build something like this from scratch with something like [react hook form](https://react-hook-form.com/) and build all the necessary logic and APIs. Neither we wanted a solution like google form, where we can embed the form and then have a cronjob at midnight to add entries to database from google sheets (also google forms UI is a bit of let-down). So we starting looking for alternatives.

## The issue with Typeform

We were already using typeform on our [Contribute](https://www.puzzledquant.com/contribute) page, and its [Webhooks API](https://www.typeform.com/developers/webhooks/) seemed promising to fetch user response, process it and add it to our database. Typeform's UI is beautiful and interactive, and we were ready to go for it. But! We realised we were using Typeform's free tier, which only allowed 10 responses per month. Even 25 USD/month allows just 100 monthly responses. That was a shame, as spending such a hefty amount of money for such a basic task didn't justify much. Other modern form builders like Jotform, etc. had a similar story.

Pondering over should I start building from scratch, a core memory unlocked as I got reminded of some free form builder I saw on Product Hunt a couple of months ago. I immediately started searching my gmail looking for a mail from Product Hunt, and found exactly what we were looking for - [Tally](https://tally.so/).

# Journey with Tally

As Tally is almost free, I was a bit skeptical if it would have webhooks. But not just that, it does have a [ton of features](https://tally.so/help/features). It has very clean UI (Notion-like) and using powerful [conditional blocks](https://tally.so/help/conditional-form-logic), we were able to quickly a build a form covering different use cases of our audience. 

## Initial Approach - Webhooks

The initial approach was simple, embed the form on our page and add the webhook url. The POST method at webhook url receives the json payload as an array of entries, with unique identifier and label for fields and the selected option ids, which was easy to parse (_Note that the webhook url cannot be a localhost, which was a bit disappointing since that made dev testing a bit harder_). Tally offers elegant ways of embedding, and we chose popup in center on page reload.

{% include image.html url="/assets/img/blogs/tally-1.png" description="Different embed options [1]" %}
{% include image.html url="/assets/img/blogs/tally-2.png" description="Code snippet builder [2]" %}

<span class="mark">But there was a problem, we didn't know the user who filled the form when processing the response from webhook.</span> We could have asked for email of user in the form, and then used it to query user from db, but it is very well possible that user enters an email different from with which they created the account on our page. This doesn't make a good user experience. Still, we started the integration process.

## Working with Next.js app router 

Tally generated the following code snippet to be added to `<head>` section of our website.

```html
<script async src="https://tally.so/widgets/embed.js"></script>

<script>
window.TallyConfig = {
  "formId": "xxxxxx",
  "popup": {
    "emoji": {
      "text": "👋",
      "animation": "wave"
    },
    "layout": "modal"
  }
};
</script>
```

Since PuzzledQuant is built on the new Next.js v13 with app router, we didn't get much help online, aside from a community resource by [Ashik Nesin](https://nesin.io/blog/tally-so-form-embed-next-js-integration). But this was relatively simple since it showed how to work with iframe embedding (Standard embed in [1]). Anyways, we achieved the following as follows :-

```tsx
// app/layout.tsx
import TallyForm from '@/components/TallyForm'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://tally.so/widgets/embed.js"
        />
      </head>
      <body>
        {(currentUser && !currentUser.filledUserSurvey) 
            ? <TallyForm /> 
            : <></>}
        {children}
      </body>
    </html>
  )
}
```

Here the `currentUser.filledUserSurvey` boolean is fetched from db and checks if the user has already filled the form, and helps in conditionally rendering the form.

```tsx
// components/TallyForm.tsx
"use client"

const TallyForm: React.FC = () => {
    if (typeof window !== "undefined") {
        // @ts-ignore
        window.TallyConfig = {
            "formId": "3xMgpr",
            "popup": {
                "emoji": {
                "text": "👋",
                "animation": "wave"
                },
                "layout": "modal"
            }
        };
    }

    return (
        <></>
    )
}

export default TallyForm
```

<span class="mark">Working with typescript, `@ts-ignore` is important otherwise you would get the error `Property 'TallyConfig' does not exist on type 'Window & typeof globalThis'`. Also, `typeof window !== "undefined"` is an [idiomatic check](https://stackoverflow.com/questions/32598971/whats-the-purpose-of-if-typeof-window-undefined) to see if the script is being run in a web-page inside a web-browser or not.</span> Note that you can also use script tag with `dangerouslySetInnerHTML` and insert the window.TallyConfig object configuration.

This seemed to work, but still the issue of somehow getting the information of logged-in user was left.

{% include image.html url="/assets/img/blogs/tally-3.jpeg" %}

### Perfect Solution - Utilising the handy window.Tally object

<span class="mark">In addition to just specifying configuration of popup with `TallyConfig` object in window, they also provide a `Tally` object to open and close popups using JavaScript.</span> Citing their documentation,

```javascript
// Include the Tally widget script in the <head> section of your page
<script src="https://tally.so/widgets/embed.js"></script>

// Open the popup
Tally.openPopup(formId, options);

// Available options
type PopupOptions = {
  key?: string;
  layout?: 'default' | 'modal';
  width?: number;
  alignLeft?: boolean;
  hideTitle?: boolean;
  overlay?: boolean;
  emoji?: {
    text: string;
    animation: 'none' | 'wave' | 'tada' | 'heart-beat' | 'spin' | 'flash' | 'bounce' | 'rubber-band' | 'head-shake';
  };
  autoClose?: number;
  showOnce?: boolean;
  doNotShowAfterSubmit?: boolean;
  customFormUrl?: string;
  hiddenFields?: {
    [key: string]: any,
  };
  onOpen?: () => void;
  onClose?: () => void;
  onPageView?: (page: number) => void;
  onSubmit?: (payload: any) => void;
};
```

And then it clicked! We can use the `onSubmit` function to directly send the payload to our backend API. With this, the current user session information is not lost, and we also eliminate the use of webhooks. Hence, we changed the front-end logic to

```tsx
// components/TallyForm.tsx
"use client"
import axios from "axios"

const TallyForm: React.FC = () => {
    if (typeof window !== "undefined") {
        // @ts-ignore
        window.Tally.openPopup("xxxxxx", {
            layout: "modal",
            width: popupWidth,
            autoClose: 2000,
            emoji: {
                text: "👋",
                animation: "wave"
            },
            onSubmit: (payload: any) => {
                axios.post("/api/tally", payload)
                    .then((response) => {
                        console.log(response.data) // @testing purpose
                    })
                    .catch((error) => {
                        console.log(error.response.data) // @testing purpose
                    })
            }
        })
    }

    return (
        <></>
    )
}

export default TallyForm
```

and the server-side API logic

```tsx
// app/api/tally/route.ts
import { NextRequest, NextResponse } from "next/server"

import getCurrentUser from "@/actions/getCurrentUser"

interface IAnswer {
    value: string
}

interface IField {
    id: string
    title: string
    type: string
    answer: IAnswer | null
}

interface IBody {
    fields: IField[]
}

export async function POST(
    request: NextRequest,
) {
    const body: IBody = await request.json()
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.error()
    }

    let entry: Record<string, string | null> = {}

    for (const field of body.fields) {
        if (field.answer === null) {
            entry[field.id] = null
        } else {
            entry[field.id] = field.answer?.value || null
        }
    }

    // use entry to create new row in database,
    // and mark user.filledUserSurvey as true

    return NextResponse.json({ "status": "ok" })
}
```

And solution is working nice and seamlessly.

### Ending note

Some might argue that this integration may have took us more time, but now once the flow is figured out, it is just a minutes setup to integrate it all. I don't think I will be doing any building from scratch for forms for any of my small to medium sized projects from now. I really loved Tally, and appreciate the team behind it to create such a feature-rich tool, and that too practically free (unless you want to remove Tally branding, or add custom domain for form etc.). Hope this helps as a guide to others looking out to build something similar, and increase awareness of awesome UX and DX-friendly tools like Tally.

Signing out,<br>
Dev@PuzzledQuant