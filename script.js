// Set up canvas and context for drawing
const drawCanvas = document.getElementById("drawCanvas");
const drawCtx = drawCanvas.getContext("2d");
drawCanvas.width = window.innerWidth / 2;
drawCanvas.height = window.innerHeight;

// set up video and canvas for live video feed
const video = document.getElementById("video");
const liveCanvas = document.getElementById("liveCanvas");
const liveCtx = liveCanvas.getContext("2d");
liveCanvas.width = window.innerWidth / 2;
liveCanvas.height = window.innerHeight;

// HandTrack.js module parameters
const moduleParams = {
  flipHorizontal: true,
  maxNumBoxes: 5,
  iouThreshold: 0.5,
  scoreThreshold: 0.6,
};

let prevX = null;
let prevY = null;
let pointerColor = "red";

// Function to draw on canvas whtn a hand is detected
function drawFromHand(x, y, isClosed, isOpen) {
  if (prevX == null || prevY == null) {
    prevX = x;
    prevY = y;
  }

  // If "open" gesture, clear the drawing(eraser)
  if (isOpen) {
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    resetDrawing();
    return;
  }

  // If "closed" gesture, change the pointer color randomly but don't draw
  if (isClosed) {
    pointerColor = getRandomColor();
    return;
  }

  drawCtx.strokeStyle = pointerColor;
  drawCtx.lineWidth = 3;
  drawCtx.lineCap = "round";
  drawCtx.baginPath();
  drawCtx.moveTo(prevX, prevY);
  drawCtx.lineTo(x, y);
  drawCtx.stroke();

  prevX = x;
  prevY = y;
}
// Helper function to generate a random color
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// function to reset the drawing state
function resetDrawing() {
  prevX = null;
  prevY = null;
}

// Start the video feed and detect hand gestures
handTrack.startVideo(video).then((status) => {
  if (status) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(() => {
      handTrack.load(moduleParams).then((model) => {
        setInterval(() => {
          model.detect(video).then((predictions) => {
            liveCtx.clearRect(0, 0, liveCanvas.width, liveCanvas.height);
            model.randerPredictions(predictions, liveCanvas, liveCtx, video);

            // Find the "open", "closed", and "point" gestures
            const open = predictions.find((p) => p.label === "open");
            const closed = predictions.find((p) => p.label === "closed");
            const point = predictions.find((p) => p.label === "point");

            if (open) {
              drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
              resetDrawing();
            }

            if (closed) {
              const [x, y, w, h] = closed.bbox;
              const centerX =
                ((x + w / 2) / video.videoWidth) * drawCanvas.width;
              const centerY =
                ((y + w / 2) / video.videoHeight) * drawCanvas.height;

              drawFromHand(centerX, centerY, true, false);
            } else if (point) {
              const [x, y, w, h] = point.bbox;
              const centerX =
                ((x + w / 2) / video.videoWidth) * drawCanvas.width;
              const centerY =
                ((y + w / 2) / video.videoHeight) * drawCanvas.height;

              drawFromHand(centerX, centerY, false, false);
            } else {
              resetDrawing();
            }
          });
        });
      }, 100);
    });
  }
});
