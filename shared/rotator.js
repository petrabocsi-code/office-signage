// Reads slides.json and crossfades through the listed slides using stacked iframes.
// slides.json format: [{ "file": "slides/welcome.html", "seconds": 15 }, ...]

(async function () {
  const stage = document.getElementById("stage");
  const placeholder = document.getElementById("placeholder");

  let slides = [];
  try {
    const res = await fetch("slides.json", { cache: "no-store" });
    slides = await res.json();
  } catch (e) {
    slides = [];
  }

  if (!Array.isArray(slides) || slides.length === 0) {
    placeholder.hidden = false;
    return;
  }

  // Build one iframe per slide, stacked and hidden.
  const frames = slides.map(function (slide) {
    const f = document.createElement("iframe");
    f.src = slide.file;
    f.className = "frame";
    stage.appendChild(f);
    return f;
  });

  let current = 0;
  frames[0].classList.add("visible");

  function next() {
    const upcoming = (current + 1) % frames.length;
    frames[upcoming].classList.add("visible");
    frames[current].classList.remove("visible");
    current = upcoming;
    schedule();
  }

  function schedule() {
    const seconds = Number(slides[current].seconds) || 15;
    setTimeout(next, seconds * 1000);
  }

  if (frames.length > 1) schedule();
})();
