var field, subfield, positionsPool, newbuf, chosen, numOfBalls;

const initField = () => new Array(9).fill(0).map(el => el = new Array(9).fill(0));

const createPositionsPool = () =>
{
    var arr = [], j = 0;

    for(var i = 0; i < 89; i++)
    {
        arr[j] = i;
        j++;

        if(i % 10 == 8) i++;
    }

    return arr;
};

const setInitialSettings = () =>
{
	field = initField();
	subfield = initField();
	positionsPool = createPositionsPool();	
	chosen = false;	
	newbuf = [[],[]];
	numOfBalls = 0;
};

const getPositionFromPool = () => positionsPool[Math.floor(Math.random() * positionsPool.length)];

const setGameState = (i, j, action, ...args) =>
{
	const updatePositionsPool = (remove = true, swap = false, x = null, y = null) =>
	{
		if(remove)
		{		
			const index = positionsPool.indexOf(i * 10 + j);		
			positionsPool[index] = positionsPool[0];
			positionsPool.shift();

			if(swap) positionsPool.push(x * 10 + y);					
		}
		else positionsPool.push(i * 10 + j);	
	};

	switch(action)
	{
		case "add" :			
			var [color, newBalls] = args;
			field[i][j] = color;
			updatePositionsPool();
	
			newbuf[0][newBalls] = i;
			newbuf[1][newBalls] = j;

			numOfBalls++;
			break;

		case "move" :
			var [x, y, color] = args;
			field[i][j] = color, field[x][y] = 0;
			updatePositionsPool(true, true, x, y);
			break;

		case "delete" :
			field[i][j] = 0;
			updatePositionsPool(false);
			numOfBalls--;
			break;	
	}	
	
};

const createFieldCopy = arr =>
{
	var a, b;	
	
	for(var i = 0; i < 81; i++)
	{
		a = Math.floor(i / 9);
		b = i % 9;
		
		arr[a][b] = field[a][b];
	}
	
	return arr;	
};

const ballMove = (i, j, x, y) =>
{	
	var color = field[x][y], search = true, pathFound = false, num;
	
	subfield = createFieldCopy(subfield);	
	subfield[i][j] = 1000;
	subfield[x][y] = 10;
	num = subfield[x][y];
	
	const checkSquare = (h, v) =>
	{	
		if(subfield[h][v] == 0)
		{
			pathFound = true;
			subfield[h][v] = num + 10;					
		}
		else if(subfield[h][v] == 1000)
		{
			setGameState(i, j, "move", x, y, color);			
			search = false; pathFound = true;			
		}	
		
	};	
	
	while(search)
	{		
		for(var a = 0; a < 81; a++)
		{
			var h = a % 9, v = Math.floor(a / 9);
						
			if(subfield[h][v] == num)
			{
				if(v - 1 >= 0) 				   //Check Top				  
				{
					checkSquare(h, v-1);
					if(!search) break;
					
				}
				
				if(h + 1 <= 8) 					//Check Right				  
				{										
					checkSquare(h + 1, v);
					if(!search) break;					
					
				}
				
				if(v + 1 <= 8) 					//Check Bottom				  
				{										
					checkSquare(h, v + 1);
					if(!search) break;				
					
				}
				
				if(h - 1 >= 0) 					//Check Left				  
				{									
					checkSquare(h - 1, v);
					if(!search) break;										
				}
				
			}					 
			
		}
		
		if(pathFound == false) break;		
		else if(search)        pathFound = false;
						
		num += 10;
		
	}	

	return pathFound;	
	
};

const checkCanvasClick = (i, j, tempX, tempY) =>
{
	var color;	

	if((i > 8 || i < 0) || (j > 8 || j < 0)) return null;	

	if(!chosen && field[i][j] > 0)
	{		
		color = field[i][j];
		chosen = true;		
		return { msg: "ball is chosen", color };
	} 

	if(chosen && i == tempX && j == tempY) return null;

	if(chosen && field[i][j] > 0)
	{		
		color = field[i][j];
		return { msg: "another ball is chosen", color};
	} 

	if(chosen && field[i][j] == 0)
	{			
		if(ballMove(i, j, tempX, tempY))
		{			
			chosen = false;
			return { msg: "ball is moved", color };
		}
		else return { msg: "wrong square" };
	}	
	
};

const checkNewLines = amount =>
{
	var n = amount - 1, i, j, color, result;	
	
	i = newbuf[0][n];
	j = newbuf[1][n];
	color = field[i][j];	
	
	if(field[i][j] > 0) result = checkDelete(i, j, color);
	else 				result = {state: false}	
	
	return result;
	
};

const checkDelete = (i, j, color) =>
{
	var count = 0, x = i, y = j;     				
	var delbuf =[[],[]];

	const countBalls = direction =>
	{
		delbuf[0][count] = x;
		delbuf[1][count] = y;
		count++;

		switch(direction)
		{
			case "left"         : x--; break;			
			case "right"        : x++; break;
			case "top"          : y--; break;
			case "bottom"       : y++; break;
			case "left-bottom"  : x--; y++; break;
			case "left-top"     : x--; y--; break;
			case "right-bottom" : x++; y++; break;
			case "right-top"    : x++; y--; break;
		}
	};
	
	const deleteBalls = () =>
	{
		if(count == 5)
		{		
			for(count = 0; count < 5; count++)
			{
				x = delbuf[0][count];			
				y = delbuf[1][count];

				setGameState(x, y, "delete");				

			} 			

			return true;
		}

		return false;
	};
	
	while(count < 5 && x >= 0 && field[x][y] == color)  	
	{
		countBalls("left");		
	}
	
	x = i + 1;	
	
	while(count < 5 && x < 9 && field[x][y] == color)  		
	{	
		countBalls("right");		
	}
	
	if(deleteBalls()) return { state: true, delbuf, color };	
	
	count = 0;
	x = i;	
	
	while(count < 5 && y >= 0 && field[x][y] == color)  	
	{
		countBalls("top");		
	}
	
	y = j + 1;
	
	while(count < 5 && y < 9 && field[x][y] == color)  	
	{
		countBalls("bottom");		
	}
	
	if(deleteBalls()) return { state: true, delbuf, color };		
	
	count = 0;	
	y = j;
	
	while(count < 5 && x >= 0 && y >= 0 && field[x][y] == color)  	
	{		
		countBalls("left-top");
	}
	
	x = i + 1;
	y = j + 1;
	
	while(count < 5 && x < 9 && y < 9 && field[x][y] == color)  	
	{
		countBalls("right-bottom");		
	}
	
	if(deleteBalls()) return { state: true, delbuf, color };	
	
	count = 0;
	x = i;
	y = j;
	
	while(count < 5 && x < 9 && y >= 0 && field[x][y] == color)  	
	{
		countBalls("right-top");		
	}
	
	x = i - 1;
	y = j + 1;
	
	while(count < 5 && x >= 0 && y < 9 && field[x][y] == color)  	
	{
		countBalls("left-bottom");		
	}
	
	if(deleteBalls()) return { state: true, delbuf, color };
	
	return {state: false};
}

export {setInitialSettings, setGameState, getPositionFromPool,
	    checkCanvasClick, checkNewLines, checkDelete, numOfBalls};