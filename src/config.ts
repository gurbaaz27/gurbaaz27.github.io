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
  firebase: {
    apiKey: "AIzaSyAFXNRAk0_lkYRG5Vipo39IgvjzewQR91A",
    authDomain: "gurbaaz-xyz.firebaseapp.com",
    databaseURL: "https://gurbaaz-xyz-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gurbaaz-xyz",
    storageBucket: "gurbaaz-xyz.firebasestorage.app",
    messagingSenderId: "826877159682",
    appId: "1:826877159682:web:52867988a769d97507fa1b",
  },
  utterances: {
    repo: "gurbaaz27/gurbaaz27.github.io",
    issueTerm: "title",
    theme: "github-light",
    label: "blog-comments",
  },
} as const;
