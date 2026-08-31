const fs = require("fs");

const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("css/main.css", "utf8");
const cards = [...html.matchAll(/<article class="pane(?: wide)?">([\s\S]*?)<\/article>/g)];

if (cards.length === 0) {
  throw new Error("No project cards found");
}

for (const [index, cardMatch] of cards.entries()) {
  const card = cardMatch[1];
  const title = card.match(/<a class="name" href="([^"]+)">([^<]+)<\/a>/);
  const firstFooterLink = card.match(/<p class="links">[\s\S]*?<a href="([^"]+)"/);

  if (!title) {
    throw new Error(`Card ${index + 1} does not have a linked title`);
  }
  if (!firstFooterLink) {
    throw new Error(`Card ${index + 1} does not have a footer link`);
  }
  if (title[1] !== firstFooterLink[1]) {
    throw new Error(`Card "${title[2]}" does not target its first footer link`);
  }
}

if (!/\.pane-title \.name::after\s*{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s.test(css)) {
  throw new Error("Project title links do not stretch across their cards");
}

if (!/\.pane-body \.links\s*{[^}]*position:\s*relative;[^}]*z-index:\s*2;/s.test(css)) {
  throw new Error("Project footer links are not layered above the card link");
}

console.log(`Validated ${cards.length} clickable project cards`);
