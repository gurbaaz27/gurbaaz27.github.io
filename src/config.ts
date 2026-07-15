export const siteConfig = {
  origin: "https://gurbaaz.xyz",
  author: "Gurbaaz | ਗੁਰਬਾਜ਼",
  avatar: "/assets/img/pfp-2.png",
  nav: [
    ["About Me", "/aboutme/"],
    ["Blog", "/blog/"],
    ["Resume", "/assets/docs/cv.pdf"],
  ] as const,
  social: {
    github: "https://github.com/gurbaaz27",
    linkedin: "https://linkedin.com/in/gurbaaznandra",
    instagram: "https://www.instagram.com/_gur.baaz_/",
  },
  waline: {
    serverURL: "https://comments.gurbaaz.xyz",
  },
} as const;
