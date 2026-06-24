const scenes = {
  office: {
    src: "static/videos/ace_visualization_office_web.mp4",
    poster: "static/images/ace_visualization_office_web.webp",
  },
  redkitchen: {
    src: "static/videos/ace_visualization_redkitchen_web.mp4",
    poster: "static/images/ace_visualization_redkitchen_web.webp",
  },
  chess: {
    src: "static/videos/ace_visualization_chess_web.mp4",
    poster: "static/images/ace_visualization_chess_web.webp",
  },
  pumpkin: {
    src: "static/videos/ace_visualization_pumpkin_web.mp4",
    poster: "static/images/ace_visualization_pumpkin_web.webp",
  },
  fire: {
    src: "static/videos/ace_visualization_fire_web.mp4",
    poster: "static/images/ace_visualization_fire_web.webp",
  },
  heads: {
    src: "static/videos/ace_visualization_heads_web.mp4",
    poster: "static/images/ace_visualization_heads_web.webp",
  },
};

const demoVideo = document.querySelector("#demo-video");
const sceneButtons = document.querySelectorAll(".scene-tab");

sceneButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const scene = scenes[button.dataset.video];

    if (!scene || !demoVideo) {
      return;
    }

    sceneButtons.forEach((item) => item.setAttribute("aria-pressed", "false"));
    button.setAttribute("aria-pressed", "true");
    demoVideo.pause();
    demoVideo.poster = scene.poster;
    demoVideo.querySelector("source").src = scene.src;
    demoVideo.load();
  });
});
