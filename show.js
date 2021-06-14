import {setInitialSettings, getPositionFromPool, checkCanvasClick,
	 	checkNewLines, checkDelete, setGameState, numOfBalls} from "./lines.js";

const canvas 	   = document.getElementById("canvas"),
	  ctx    	   = canvas.getContext("2d"),
	  container    = document.getElementById("container"),
	  interfaceBtn = document.getElementById("interface__button"),
	  refreshImg   = interfaceBtn.querySelector("img"),
	  scoreField   = document.getElementById("interface__score-field"),
	  recordField  = document.getElementById("record"),
	  board = new Image(), ballsImg = new Image(), animImg = new Image(), delAnimImg = new Image(),
 	  cutWidth = 40, cutHeight = 39, dx = 4, dy = 8, squareShift = 45;

var animationTimer, record, ballsSpawn = 3, numOfPts = 0;

const getRecord = () =>
{
	record = +localStorage.getItem("record");

	if(!record)
	{
		localStorage.setItem("record", "0");
		record = 0;
	} 
	
	recordField.insertAdjacentText("beforeend", `${record}`);
};

const drawBalls = amount =>
{	
	var i, j, color, num;
	
	for(var newBalls = 0; newBalls < amount; newBalls++)
	{
		if(numOfBalls == 81) break;	
		
		num = getPositionFromPool();
		i = Math.floor(num / 10);
		j = num % 10;

		color = Math.floor(Math.random() * 7) + 1;	
		
		ctx.drawImage(ballsImg, 0, cutWidth * (color - 1), cutWidth, cutHeight,
					  dx + squareShift * i, dy + squareShift * j, cutWidth, cutHeight);		

		setGameState(i, j, "add", color, newBalls);		
						 
	}	
	
	return newBalls;
}

const initBoard = () =>
{
	setInitialSettings();

	canvas.width = 407;
	canvas.height = 414;
	
	getRecord();

	board.src = "img/board.png";
	board.onload = () =>
	{
		ctx.drawImage(board, 0, 0);

		ballsImg.src = "img/balls.png";
		ballsImg.onload = () => drawBalls(5);
	};

	animImg.src = "img/jumpballs.png";	
	delAnimImg.src = "img/outballs.png";	
};

const initRestart = () =>
{
	interfaceBtn.addEventListener("click", () =>
	{
		refreshImg.classList.add("refreshing");		

		clearInterval(animationTimer);
		setInitialSettings();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		numOfPts = 0;
		scoreField.innerText = numOfPts;
		ballsSpawn = 3;		
		ctx.drawImage(board, 0, 0);
		drawBalls(5);
	});

	refreshImg.addEventListener("transitionend", () => refreshImg.classList.remove("refreshing"));
};

const showMsg = (msg, time, classIn, classOut, recordImproved = false) =>
{
	container.style.position = "relative";

	const msgBox = document.createElement("div"),
		  wrapper = document.createElement("div"),
	      msgContainer = document.createElement("div");	

	msgBox.id = "msg-box";
	wrapper.id = "wrapper";	
	wrapper.classList.add("animate__animated", classIn);

	if(recordImproved) msg += "<br><span style='color: #0066cb'>Вы обновили свой рекорд!</span>";

	msgContainer.innerHTML = msg;	
	wrapper.append(msgContainer);	
	msgBox.append(wrapper);	
	container.append(msgBox);	

	setTimeout(() =>
	{
		wrapper.classList.add(classOut);		
		
		wrapper.addEventListener("animationend", () => 
		{
			msgBox.remove();			
			container.style.position = "";
		});		

	} , time);

};

const checkGameEnd = () =>
{	
	if(numOfBalls == 81)
	{
		var recordImproved = false;

		if(numOfPts > record)
		{
			recordImproved = true;
			record = numOfPts;
			localStorage.setItem("record", record);
			recordField.childNodes[1].remove();
			recordField.insertAdjacentText("beforeend", `${record}`);
		} 

		showMsg("Игра завершена!", 2500, "animate__bounceInDown", "animate__rollOut", recordImproved);
	} 	
};

const isLineDeleted = result =>
{
	if(result.state)
	{
		showDeleteAnimation(result.delbuf, result.color);
		ballsSpawn = 0;

		numOfPts += 10;
		scoreField.innerText = numOfPts;

		return true;
	} 
};

const initAnimation = () =>
{
	var frame = 1, color, tempX, tempY, amount;	

	ctx.fillStyle = "#c5c5c5";	
	
	canvas.addEventListener("pointerdown", e =>
	{ 
		var x = e.pageX - canvas.offsetLeft;		 
		var y = e.pageY - canvas.offsetTop;		
		var i = Math.floor(x / 45), j = Math.floor(y / 45);		

		var result = checkCanvasClick(i, j, tempX, tempY) || {msg: "no handler"};
		
		const ballIsChosen = (another = false) =>
		{
			if(another) stopAnimation(tempX, tempY, color);

			tempX = i, tempY = j, color = result.color;			

			animationTimer = setInterval(() =>
			{
				ctx.drawImage(animImg, cutWidth * frame, cutWidth * (color - 1), cutWidth, cutHeight,
					          dx + squareShift * i, dy + squareShift * j, cutWidth, cutHeight);
			
				frame++;
				if(frame == 6) frame = 0;	
			}, 60);	
		};		

		const ballIsMoved = () =>
		{
			var time = 0;

			stopAnimation(tempX, tempY, color);			

			ctx.fillRect(dx + squareShift * tempX, dy + squareShift * tempY, cutWidth, cutHeight);
			ctx.drawImage(ballsImg, 0, cutWidth * (color - 1), cutWidth, cutHeight,
					  dx + squareShift * i, dy + squareShift * j, cutWidth, cutHeight);	

			if(isLineDeleted(checkDelete(i, j, color))) time = 1000;
			
			setTimeout(() =>
			{
				if(ballsSpawn != 3) ballsSpawn++;
				amount = drawBalls(ballsSpawn);

				while(amount > 0)
				{					
					isLineDeleted(checkNewLines(amount));				

					amount--;
				}	

				checkGameEnd();	

			}, time);					 
		
		};		

		switch(result.msg)
		{
			case "ball is chosen"         : ballIsChosen(); break;				
			case "another ball is chosen" : ballIsChosen(true); break;
			case "ball is moved"          : ballIsMoved(); break;
			case "wrong square"           : showMsg("Недопустимый ход!", 1000,
												    "animate__bounceIn", "animate__bounceOut");
		}		
		
	}); 
}

const stopAnimation = (tempX, tempY, color) =>
{	
	clearInterval(animationTimer);		
	
	ctx.clearRect(dx + squareShift * tempX, dy + squareShift * tempY, cutWidth, cutHeight);	
	ctx.drawImage(ballsImg, 0, cutWidth * (color - 1), cutWidth, cutHeight,
					  dx + squareShift * tempX, dy + squareShift * tempY, cutWidth, cutHeight);	
	
};

const showDeleteAnimation = (delbuf, color) =>
{
	var i, j, num = 0;

	const launchAnimation = () =>
	{
		i = delbuf[0][num];
		j = delbuf[1][num];		

		drawDeleteFrame(i, j, color);

		num++;

		if(num < 5) setTimeout(launchAnimation, 50);
			
	};
	
	launchAnimation();		
	
};

const drawDeleteFrame = (i, j, color, frame = 0) =>
{	
	ctx.drawImage(delAnimImg, cutWidth * frame, cutWidth * (color - 1), cutWidth, cutHeight,
				  dx + squareShift * i, dy + squareShift * j, cutWidth, cutHeight);
	
	frame++;
	
	if(frame < 10) setTimeout(drawDeleteFrame, 80, i, j, color, frame);
	else  		   ctx.fillRect(dx + squareShift * i, dy + squareShift * j, cutWidth, cutHeight);	
};

export{initBoard, initRestart, initAnimation};