const switcher = document.querySelector("[data-results-switcher]");

if (switcher) {
  const video = switcher.querySelector("[data-results-video]");
  const source = video?.querySelector("source");
  const tabs = Array.from(switcher.querySelectorAll(".scene-tab"));

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      if (!video || !source || tab.classList.contains("is-active")) {
        return;
      }

      tabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      source.src = tab.dataset.video;
      video.poster = tab.dataset.poster;
      video.load();
      video.play().catch(() => {});
    });
  });
}
