# Overview

bland.md is a simple, no-frills note-taking tool where users can write using Markdown. The default experience is clean, minimalistic, and intuitive, focusing on the act of writing without distractions. Users can customize the interface for personal preferences, and there is a paid tier for syncing notes across devices.

I aim to create an dynamic markdown expirence in which the user works in a hybrid editor-preview enviroment.

# Planned Features

## KISS
- Focus on simplicity: open the page, write, and close it with no login, adds, or unnecessary distractions.
- The primary goal is usability, and the default state should always be minimal and straightforward.
## Markdown
- Support for Markdown syntax to write notes, including headings, bold/italic text, lists, and code blocks.
- The markdown will be live, similarly to how its done in obsidian.md.
## localStorage
- Notes are stored in **localStorage** by default, so when the user returns to the site, their notes persist (without any need for sign-in).
- Ideal for the simple, frictionless experience.
- Notes are saved as raw Markdown text, and the content is available even after page reloads.
## Freemium
- **Free Tier**: All features are free by default. Notes are saved locally on the browser via **localStorage**.
- **Paid Tier**: Users can pay a small fee (~$10/month) for cross-device syncing. This feature is optional and is designed to support the tool without feeling forced.
- Focused on **transparency**: Only the sync feature is behind the paywall, keeping the writing experience free.
## Customizability (coming later)
- **Pre-made Themes**: Users can choose between a few themes (e.g., dark mode, light mode, minimalistic, etc.).
- **Custom Themes**: Allows users to apply their own custom CSS for personalization. This could include font choices, background images/colors, and other visual tweaks.
- **Advanced Settings** (optional): For users who want more control, they could inject their own CSS or JavaScript to fully customize the page.
- **Persistent Settings**: Customizations are saved locally in the browser (via localStorage), persist across sessions, and even devices if the user has the paid tier and they are then saved across devices.

# Personal

Hey I'm just a college indie dev, not a large cooperation. I make tools for myself, and if other people want to use it--not only is that ok with me, that is the best feeling in the world to have people appreciate your work. I couldn't care less about the money and if I do make something its all just gonna go towards college.

No amount of partying, `A+`s, or sex feels better than your hard work being appreciated. Thank you all.

> This is just a note for the devs, but I may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment, which is Vercel.
