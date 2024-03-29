var canvas;
var ctx;
var txt;
var fps = 60;
var mousePos_x;
var mousePos_y;

var difficulty;
var difficulty_ball_y_multiplier;
var easy_width;
var medium_width;
var hard_width;

var ball_x = 50;
var ball_y = 50;
const default_speed_x = 5;
const default_speed_y = 4;
var ball_speed_x = 5;
var ball_speed_y = 4;

var ppaddle_y = 250;
var aipaddle_y = 250;
var aipaddle_y_move = 6;
var aipaddle_release;

var show_start_screen = true;
var p1score = 0;
var p2score = 0;
var show_win_screen = false;
var just_scored;
var scorer;

var paused = false;
var pause_render = false;

const PADDLE_THICKNESS = 10;
const PADDLE_HEIGHT = 100;
const WINNING_SCORE = 5;

window.onload = function() {
    /* Setting background color to black. */
    document.body.style.backgroundColor = 'black';

    /* Getting the canvas object and creating variable. */
    canvas = document.getElementById('gameCanvas');
    canvas.width = 800;
    canvas.height = 600;
    ctx = canvas.getContext('2d');

    // original context settings
    ctx.save();

    // shadows for glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ff073a';

    /* Calls draw and move fps frames per second. */
    setInterval(function() {
        move();
        draw();
    }, 1000/fps);

    /* Event listener for escape key press. */
    document.addEventListener('keyup',
        function(evt) {
            var key = evt.key || evt.keyCode;
            if (key === 'Escape' || key === 'Esc' || key === 27) {
                if (paused) {
                    paused = false;
                } else if (!paused && !show_start_screen && !show_win_screen){
                    paused = true;
                    pause_render = false;
                }
            }
        });

    /* Event listener for mouse position. */
    canvas.addEventListener('mousemove',
        function(evt) {
            var mousePos = calcMousePos(evt);
            mousePos_x = mousePos.x;
            mousePos_y = mousePos.y;
            ppaddle_y = mousePos.y - (PADDLE_HEIGHT/2);
            if (ppaddle_y < 0) {
                ppaddle_y = 0;
            } else if (ppaddle_y > canvas.height - PADDLE_HEIGHT) {
                ppaddle_y = canvas.height - PADDLE_HEIGHT;
            }
        });

    /* Event listener for mouse click. */
    canvas.addEventListener('mousedown',
        function(evt) {
            // logic for shooting ball
            if (just_scored && scorer == 'P2' && !show_win_screen) {
                paddleShot();
                just_scored = false;
                return;
            }

            // logic for start screen and win screen
            if (show_start_screen || show_win_screen) {
                var valid_click = false;
                if (mousePos_x >= canvas.width/2 - easy_width/2 &&
                    mousePos_x <= canvas.width/2 + easy_width/2 &&
                    mousePos_y >= 380 - 20 &&
                    mousePos_y <= 380) {
                    aipaddle_y_move = 6;
                    valid_click = true;
                    difficulty = 'EASY';
                    difficulty_ball_y_multiplier = 0.29;
                } else if (mousePos_x >= canvas.width/2 - medium_width/2 &&
                    mousePos_x <= canvas.width/2 + medium_width/2 &&
                    mousePos_y >= 420 - 20 &&
                    mousePos_y <= 420) {
                    aipaddle_y_move = 8;
                    valid_click = true;
                    difficulty = 'MEDIUM';
                    difficulty_ball_y_multiplier = 0.32;
                } else if (mousePos_x >= canvas.width/2 - hard_width/2 &&
                    mousePos_x <= canvas.width/2 + hard_width/2 &&
                    mousePos_y >= 460 - 20 &&
                    mousePos_y <= 460) {
                    aipaddle_y_move = 10;
                    valid_click = true;
                    difficulty = 'HARD';
                    difficulty_ball_y_multiplier = 0.35;
                }
                if (valid_click) {
                    just_scored = true;
                    scorer = 'P2';
                    if (show_start_screen) {
                        show_start_screen = false;
                        just_scored = true;
                        scorer = 'P2';
                    }
                    if (show_win_screen) {
                        p1score = 0;
                        p2score = 0;
                        ball_speed_x = default_speed_x;
                        ball_speed_y = default_speed_y;
                        just_scored = true;
                        scorer = 'P2';
                        show_win_screen = false;
                    }
                }
                return;
            }
        });
}

/* Controls movement of ball object and AI. */
function move() {
    if (show_win_screen || paused || show_start_screen) {
        return;
    }

    // start of the game or if one side recently scored
    if (just_scored) {
        if (scorer == 'P2') {
            ball_y = ppaddle_y + PADDLE_HEIGHT/2;
            ball_x = PADDLE_THICKNESS + 10;
        } else if (scorer == 'P1') {
            ball_y = aipaddle_y + PADDLE_HEIGHT/2;
            ball_x = canvas.width - PADDLE_THICKNESS - 10;
            aiMove();
        }
        return;
    }

    aiMove();

    ball_x += ball_speed_x;
    ball_y += ball_speed_y;
    if (ball_x < PADDLE_THICKNESS) {
        if (ball_y > ppaddle_y &&
            ball_y < ppaddle_y + PADDLE_HEIGHT) {
            ball_speed_x *= -1;

            // determines vertical speed based on ball position relative to paddle
            var delta_y = ball_y - (ppaddle_y + PADDLE_HEIGHT/2);
            ball_speed_y = delta_y * difficulty_ball_y_multiplier;
        }
    }
    if (ball_x < 0) {
        p2score += 1;
        scorer = 'P2';
        ballReset();
    }
    if (ball_x > canvas.width - PADDLE_THICKNESS) {
        if (ball_y > aipaddle_y &&
            ball_y < aipaddle_y + PADDLE_HEIGHT) {
            ball_speed_x *= -1;

            // determines vertical speed based on ball position relative to paddle
            var delta_y = ball_y - (aipaddle_y + PADDLE_HEIGHT/2);
            ball_speed_y = delta_y * difficulty_ball_y_multiplier;
        }
    }
    if (ball_x > canvas.width) {
        p1score += 1;
        scorer = 'P1';
        ballReset();
    }
    if (ball_y > canvas.height) {
        ball_speed_y *= -1;
    }
    if (ball_y < 0) {
        ball_speed_y *= -1;
    }
}

/* Drawing objects on canvas object. */
function draw() {
    // pause screen
    if (paused) {
        if (!pause_render) {
            ctx.save();
            ctx.fillStyle = '#49fb35';
            ctx.font = 'bold 30px pdark';
            txt = 'PAUSED';
            ctx.fillText(txt, canvas.width/2
                            - ctx.measureText(txt).width/2,
                            canvas.height/2 - 15);
            ctx.restore();
            pause_render = true;
        }
        return;
    }

    // background
    colorRect(0, 0, canvas.width, canvas.height, 'black');

    // start screen
    if (show_start_screen) {
        draw_start(txt, 'pdark', 'white    ');
        return;
    }

    // win screen
    if (show_win_screen) {
        draw_win(txt, 'pdark', 'white');
        return;
    }

    // net
    drawNet();

    // player paddle
    colorRect(0, ppaddle_y, PADDLE_THICKNESS, PADDLE_HEIGHT, 'white');

    // AI paddle
    colorRect(canvas.width - 10, aipaddle_y, PADDLE_THICKNESS,
                PADDLE_HEIGHT, 'white');

    // ball
    colorCirc(ball_x, ball_y, 10, 'white');

    // scoreboard
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px pdark';
    txt = 'Score';
    ctx.fillText(txt, canvas.width/2
                    - ctx.measureText(txt).width/2, 50);
    colorRect(canvas.width/2 - 75, 55, 150, 3, 'white');
    ctx.font = 'bold 35px pdark';
    txt = p1score + '   ' + p2score;
    ctx.fillText(txt, canvas.width/2
                    - ctx.measureText(txt).width/2, 100);

    // difficulty setting indicator
    ctx.fillStyle = 'white';
    ctx.font = '20px pdark';
    txt = 'DIFFICULTY: ' + difficulty;
    ctx.fillText(txt, canvas.width - ctx.measureText(txt).width - 5, 25);
}

/* Fills in circle objects. */
function colorCirc(center_x, center_y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(center_x, center_y, radius, 0, Math.PI*2, true);
    ctx.fill();
}

/* Fills in rectangle objects. */
function colorRect(left_x, top_y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(left_x, top_y, width, height);
}

/* Draw the net. */
function drawNet() {
    for(var i = 55; i < canvas.height; i += 40) {
        colorRect(canvas.width/2 - 3, i, 6, 20, 'white');
    }
}

/* Mouse position. */
function calcMousePos(evt) {
    var rect = canvas.getBoundingClientRect();
    var root = document.documentElement;
    var mouse_x = evt.clientX - rect.left - root.scrollLeft;
    var mouse_y = evt.clientY - rect.top - root.scrollTop;
    return {
        x:mouse_x,
        y:mouse_y
    };
}

/* Simple AI controls. */
function aiMove() {
    var aipaddle_center = aipaddle_y + (PADDLE_HEIGHT/2);

    // if player just scored
    if (just_scored && scorer == 'P1') {
        aipaddle_y += aipaddle_y_move;
        if (aipaddle_y > canvas.height - PADDLE_HEIGHT) {
            aipaddle_y = canvas.height - PADDLE_HEIGHT;
            aipaddle_y_move *= -1;
        } else if (aipaddle_y < 0) {
            aipaddle_y = 0;
            aipaddle_y_move *= -1;
        }
        if (aipaddle_release >= aipaddle_y + PADDLE_HEIGHT/2 -
            Math.abs(aipaddle_y_move/2) &&
            aipaddle_release <= aipaddle_y + PADDLE_HEIGHT/2 +
            Math.abs(aipaddle_y_move/2)) {
            paddleShot(true);
            just_scored = false;
        }
    }

    // moves paddle but stays still if ball is within range of paddle center
    if (aipaddle_center < ball_y - 35) {
        aipaddle_y += Math.abs(aipaddle_y_move);
    } else if (aipaddle_center > ball_y + 35){
        aipaddle_y -= Math.abs(aipaddle_y_move);
    }
}

/* Resets ball when it hits the wall. */
function ballReset() {
    just_scored = true;
    ball_speed_x = 0;
    if (scorer == 'P1') {
        aipaddle_release = rndInt(PADDLE_HEIGHT/2,
                                    canvas.height - PADDLE_HEIGHT/2 + 1);
    }
    if (p1score >= WINNING_SCORE || p2score >= WINNING_SCORE) {
        show_win_screen = true;
    }
}

/* Shoots ball at a different y speed depending on the
    location of the paddle. */
function paddleShot(AI=false) {
    if (ball_y >= canvas.height/2 - 10 &&
        ball_y <= canvas.height/2 + 10) {
        ball_speed_y = 0;
    } else if (ball_y < canvas.height/2 - 10) {
        ball_speed_y = -default_speed_y;
    } else {
        ball_speed_y = default_speed_y;
    }
    if (AI) {
        ball_speed_x = -default_speed_x;
    } else {
        ball_speed_x = default_speed_x;
    }
}

/* Returns a random int between min (included) and max (excluded). */
function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/* Draws the starting screen with options for choosing difficulty. */
function draw_start(txt, font, color) {
    ctx.fillStyle = color;
    ctx.font = 'bold 80px' + ' ' + font;
    txt = 'PONG';
    ctx.fillText(txt, canvas.width/2
                    - ctx.measureText(txt).width/2, 225);
    draw_difficulties(txt, font, color);
}

/* Draws the win screen with options for choosing difficulty. */
function draw_win(txt, font, color) {
    ctx.fillStyle = color;
    ctx.font = 'italic bold 35px' + ' ' + font;
    if (p1score >= WINNING_SCORE) {
        txt = 'Left player wins!';
        ctx.fillText(txt, canvas.width/2
                        - ctx.measureText(txt).width/2, 200);
        ctx.font = '32px' + ' ' + font;
        txt = p1score + ' : ' + p2score;
        ctx.fillText(txt, canvas.width/2
                        - ctx.measureText(txt).width/2, 250);
    } else if (p2score >= WINNING_SCORE) {
        txt = 'Right player wins!';
        ctx.fillText(txt, canvas.width/2
                        - ctx.measureText(txt).width/2, 200);
        ctx.font = '32px' + ' ' + font;
        txt = p1score + ' : ' + p2score;
        ctx.fillText(txt, canvas.width/2
                        - ctx.measureText(txt).width/2, 250);
    }
    draw_difficulties(txt, font, color);
}

/* Draws difficulty options. */
function draw_difficulties(txt, font, color) {
    ctx.font = 'bold 35px' + ' ' + font;
    txt = 'DIFFICULTY';
    ctx.fillText(txt, canvas.width/2
                    - ctx.measureText(txt).width/2, 330);
    colorRect(canvas.width/2 - ctx.measureText(txt).width/2,
                340, ctx.measureText(txt).width, 4, 'white');
    ctx.font = 'bold 30px' + ' ' + font;
    txt = 'EASY';
    easy_width = ctx.measureText(txt).width;
    ctx.fillText(txt, canvas.width/2 - easy_width/2, 380);
    txt = 'MEDIUM';
    medium_width = ctx.measureText(txt).width;
    ctx.fillText(txt, canvas.width/2 - medium_width/2, 420);
    txt = 'HARD';
    hard_width = ctx.measureText(txt).width;
    ctx.fillText(txt, canvas.width/2 - hard_width/2, 460);
}
