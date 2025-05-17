// ported to webcam from: 
// https://p5js.org/examples/dom-video-pixels.html

let videoFeed;

let textInput = "";
let characters = [];
let textField;

let gridWidth = 0;
let gridHeight = 0;
let totalCells = 0;

let cellWidth = 0;
let cellHeight = 0;

const degreeLimit = 3000;
const saturationLimit = degreeLimit*0.3;

let colorDegrees;
let colorThreshhold;
let degreeSpread;

let colorSaturation;
let cornerRadius;
let opacity;

function setup() {
  createCanvas(400, 400);
  // specify multiple formats for different browsers
  videoFeed = createCapture({
    audio: false,
    video: { width: width, height: height }
  }, function() {
  });
  videoFeed.hide();
  
  textField = createInput();
  textField.input(inputUpdated);
  inputUpdated();
  
  noStroke();
  fill(0);
  textAlign(CENTER, CENTER);
  textFont('VT323');
  rectMode(CENTER);
}

function draw() {
  background(255);
  videoFeed.loadPixels();
  
  textSize(cellWidth*0.9);
  const tx = cellWidth/2;
  const ty = cellHeight/2;
  
  let i = 0; //index of character
  
  /* loop over grid and draw frame and character per cell */
  for (let y = 0; y < gridHeight; y += 1) {
    for (let x = 0; x < gridWidth; x += 1) {
      
      /* calc index for video feed array from grid cell */
      const p = (int(y * cellHeight) * height + int(x * cellWidth)) * 4; 
      
      /* get original color from video feed */
      let r = (videoFeed.pixels[p]);
      let g = (videoFeed.pixels[p+1]);
      let b = (videoFeed.pixels[p+2]);
      const L = (0.2126*r + 0.7152*g + 0.0722*b); //Luminosity
      
      /*
      calculate frame color in degrees
      factoring color, saturation, luminosity, and degree
      read comments in inputUpdated for more details 
      */
      r = floor((r + colorSaturation * ( L - r)) / degreeThreshhold);
      g = floor((g + colorSaturation * ( L - g)) / degreeThreshhold);
      b = floor((b + colorSaturation * ( L - b)) / degreeThreshhold);
      
      /* final frame color after spreading degrees */
      const frameFillR = r * degreeSpread;
      const frameFillG = g * degreeSpread;
      const frameFillB = b * degreeSpread;
      
      /* character color opposite of frame */
      const charFillR = 255 - frameFillR;
      const charFillG = 255 - frameFillG;
      const charFillB = 255 - frameFillB;

      
      if (i < characters.length) {
        /* draw frame */
        fill(frameFillR,frameFillG,frameFillB);
        rect((x*cellWidth)+tx,(y*cellHeight)+ty,cellWidth+0.6,cellHeight+0.6, cornerRadius);
        
        /* draw character */
        if (opacity > 0){
          fill(charFillR, charFillG, charFillB, opacity);
          text(characters[i], (x*cellWidth)+tx, (y*cellHeight)+ty);
        }
        i += 1;
      }
    }
  }
}

/* 
Calculate key mathematical variables used in draw only when needed (during text field update)
*/
function inputUpdated() {
  
  /* Keep array of characters from text in input */
  textInput = textField.value();
  characters = [];
  for (let c = 0; c < textInput.length; c += 1) {
    characters.push(textInput[c]);
  }
  
  /* Calculate grid size to fit all characters, total number of cells, and cell size */
  let numChars = characters.length;
  gridWidth = ceil(sqrt(numChars));
  gridHeight = gridWidth;
  totalCells = gridWidth*gridHeight;
  
  cellWidth = (width / gridWidth);
  cellHeight = (height / gridHeight);
  
  /* 
  To calculate 'degree' of grayscale and color fidelity. 
  Less cells (`cellsTotal`) is fewer degrees. Start with 0 cells and 2 degrees.
  More cells is more degrees. Max degrees (256) reached when `cellsTotal` reaches `degreeLimit`
  Example: 
    - 2 Degrees (pure black & white)
      - {====0====}(128){===255===}
      - `colorDegrees` = 2
      - `degreeThreshhold` = 128
      - `degreeSpread` = 255
      - First degree (0 < c <= 128) = 0 * colorSteps = 0
      - Second degree (128 < c <= 255) = 1 * colorSteps = 255
    - 3 Degrees
      - {====0====}(85){===128===}(170){===255===}
      - `colorDegrees` = 3
      - `colorThreshhold` = 85
      - `degreeSpread` ~= 128
      - First degree (0 < x <= 85) = 0 * colorSteps = 0
      - Second degree (85 < c <= 170) = 1 * colorSteps = 128
      - Third degree (170 < c <= 255) = 2 * colorSteps = 255
    - 255 Degree
      - {0}{1}{2}...{254}{255}
      - `colorDegrees` = 256
      - `colorThreshhold` = 1
      - `degreeSpread` = 1
  */
  colorDegrees =  min(255,floor(Math.pow(2, (totalCells/degreeLimit)*8) + 1));
  degreeThreshhold = round(255 / colorDegrees);
  degreeSpread = round(255 / (colorDegrees-1));
  
  colorSaturation = 1 - min(1 ,max(0,(totalCells - saturationLimit))/saturationLimit);
  
  cornerRadius = max(0,map(totalCells,0,degreeLimit,cellWidth/2,0));
  
  opacity = max(0,map(totalCells,0,degreeLimit,255,0));
}
