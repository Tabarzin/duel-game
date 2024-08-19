import "./Game.css";
import React, { useEffect, useRef, useState } from "react";

interface Hero {
  x: number;
  y: number;
  radius: number;
  speed: number;
  spellCastingSpeed: number;
  direction: number;
  color: string;
  spellColor: string;
  lastSpellTime: number;
}

interface Spell {
  x: number;
  y: number;
  radius: number;
  speed: number;
  direction: number;
  color: string;
  initialY: number;
}

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const heroesRef = useRef<{
    hero1: Hero;
    hero2: Hero;
  }>({
    hero1: {
      x: 50,
      y: 100,
      radius: 20,
      speed: 0.3,
      spellCastingSpeed: 3000,
      direction: 1,
      color: "#3498db",
      spellColor: "#3498db",
      lastSpellTime: 0,
    },
    hero2: {
      x: 450,
      y: 300,
      radius: 20,
      speed: 0.3,
      spellCastingSpeed: 3000,
      direction: -1,
      color: "#e74c3c",
      spellColor: "#e74c3c",
      lastSpellTime: 0,
    },
  });
  const spellsRef = useRef<Spell[]>([]);
  const hoverRef = useRef<"hero1" | "hero2" | null>(null);

  const [scores, setScores] = useState({ hero1: 0, hero2: 0 });
  const [menuOpen, setMenuOpen] = useState<{
    open: boolean;
    heroKey: "hero1" | "hero2" | null;
  }>({ open: false, heroKey: null });

  const [, forceUpdate] = useState({});

  const canvasWidth = 500;
  const canvasHeight = 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId: number;

    const drawHero = (context: CanvasRenderingContext2D, hero: Hero) => {
      context.beginPath();
      context.arc(hero.x, hero.y, hero.radius, 0, 2 * Math.PI);
      context.fillStyle = hero.color;
      context.fill();
      context.closePath();
    };

    const drawSpell = (context: CanvasRenderingContext2D, spell: Spell) => {
      context.beginPath();
      context.arc(spell.x, spell.initialY, spell.radius, 0, 2 * Math.PI);
      context.fillStyle = spell.color;
      context.fill();
      context.closePath();
    };

    const updatePosition = (hero: Hero, heroKey: "hero1" | "hero2"): Hero => {
      const isHovered = hoverRef.current === heroKey;
      const effectiveSpeed = isHovered ? hero.speed * 0.5 : hero.speed;
      let newY = hero.y + effectiveSpeed * hero.direction;

      if (newY - hero.radius <= 0 || newY + hero.radius >= canvasHeight) {
        hero.direction *= -1;
        newY = hero.y + effectiveSpeed * hero.direction;
      }

      return { ...hero, y: newY };
    };

    const updateSpellPosition = (
      spell: Spell,
      heroes: { hero1: Hero; hero2: Hero }
    ): Spell | null => {
      const newX = spell.x + spell.speed * spell.direction;

      const targetHero = spell.direction > 0 ? heroes.hero2 : heroes.hero1;
      const distanceToHero = Math.sqrt(
        Math.pow(newX - targetHero.x, 2) +
          Math.pow(spell.initialY - targetHero.y, 2)
      );

      if (distanceToHero <= targetHero.radius + spell.radius) {
        if (targetHero === heroes.hero1) {
          setScores((prevScores) => ({
            ...prevScores,
            hero2: prevScores.hero2 + 1,
          }));
        } else {
          setScores((prevScores) => ({
            ...prevScores,
            hero1: prevScores.hero1 + 1,
          }));
        }
        return null;
      }

      if (newX < 0 || newX > canvasWidth) {
        return null;
      }

      return { ...spell, x: newX };
    };

    const castSpell = (hero: Hero, currentTime: number) => {
      const heroDiameter = 2 * hero.radius;
      const desiredDistance = 3 * heroDiameter;
      const spellSpeed = 2;

      const minSpellInterval = desiredDistance / spellSpeed;

      const spellInterval = Math.max(minSpellInterval, hero.spellCastingSpeed);

      if (currentTime - hero.lastSpellTime >= spellInterval) {
        const lastSpell = spellsRef.current
          .filter(
            (spell) => spell.direction === (hero.x < canvasWidth / 2 ? 1 : -1)
          )
          .slice(-1)[0];

        if (!lastSpell || Math.abs(hero.x - lastSpell.x) >= desiredDistance) {
          const spell: Spell = {
            x: hero.x + (hero.x < canvasWidth / 2 ? hero.radius : -hero.radius),
            y: hero.y,
            radius: 5,
            speed: spellSpeed,
            direction: hero.x < canvasWidth / 2 ? 1 : -1,
            color: hero.spellColor,
            initialY: hero.y,
          };
          spellsRef.current.push(spell);
          hero.lastSpellTime = currentTime;
        }
      }
    };

    const gameLoop = (currentTime: number) => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      heroesRef.current.hero1 = updatePosition(
        heroesRef.current.hero1,
        "hero1"
      );
      heroesRef.current.hero2 = updatePosition(
        heroesRef.current.hero2,
        "hero2"
      );

      drawHero(context, heroesRef.current.hero1);
      drawHero(context, heroesRef.current.hero2);

      castSpell(heroesRef.current.hero1, currentTime);
      castSpell(heroesRef.current.hero2, currentTime);

      spellsRef.current = spellsRef.current
        .map((spell) => updateSpellPosition(spell, heroesRef.current))
        .filter((spell): spell is Spell => spell !== null);

      spellsRef.current.forEach((spell) => drawSpell(context, spell));

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      let clickedHeroKey: "hero1" | "hero2" | null = null;
      Object.entries(heroesRef.current).forEach(([key, hero]) => {
        const distance = Math.sqrt(
          Math.pow(clickX - hero.x, 2) + Math.pow(clickY - hero.y, 2)
        );

        if (distance <= hero.radius) {
          clickedHeroKey = key as "hero1" | "hero2";
        } else {
          const distanceX = Math.abs(clickX - hero.x);
          const distanceY = clickY - hero.y;

          if (distanceX <= hero.radius) {
            if (distanceY < 0) {
              hero.direction = 1;
            } else {
              hero.direction = -1;
            }
          }
        }
      });

      if (clickedHeroKey) {
        setMenuOpen({ open: true, heroKey: clickedHeroKey });
      } else {
        setMenuOpen({ open: false, heroKey: null });
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      let hoveredHero: "hero1" | "hero2" | null = null;
      Object.entries(heroesRef.current).forEach(([key, hero]) => {
        const distance = Math.sqrt(
          Math.pow(mouseX - hero.x, 2) + Math.pow(mouseY - hero.y, 2)
        );

        if (distance <= hero.radius) {
          hoveredHero = key as "hero1" | "hero2";
        }
      });

      hoverRef.current = hoveredHero;
      canvas.style.cursor = hoveredHero ? "pointer" : "default";
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    const handleOutsideClick = (event: MouseEvent) => {
      if (!canvas.contains(event.target as Node)) {
        setMenuOpen({ open: false, heroKey: null });
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, []);

  const handleChangeSpellColor = (
    heroKey: "hero1" | "hero2",
    color: string
  ) => {
    heroesRef.current[heroKey].spellColor = color;
    setMenuOpen({ open: false, heroKey: null });
  };

  const handleSliderChange = (
    heroKey: "hero1" | "hero2",
    field: "speed" | "spellCastingSpeed",
    value: number
  ) => {
    if (field === "spellCastingSpeed") {
      const invertedValue = 3000 - value;
      heroesRef.current[heroKey].spellCastingSpeed = invertedValue;
    } else {
      heroesRef.current[heroKey][field] = value;
    }

    forceUpdate({});
  };

  return (
    <section className="game-section">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="canvas"
      ></canvas>

      <div className="players">
        <p>
          <strong style={{ color: "#3498db" }}>Игрок 1 (Голубой):</strong>
          {scores.hero1}
        </p>
        <p>
          <strong style={{ color: "#e74c3c" }}>Игрок 2 (Красный):</strong>
          {scores.hero2}
        </p>
      </div>

      {menuOpen.open && (
        <div className="popup-menu">
          <h3 className="h3">Поменять цвет заклинания</h3>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <button
              className="popup-button blue"
              onClick={() =>
                handleChangeSpellColor(menuOpen.heroKey!, "#3498db")
              }
            >
              Blue
            </button>
            <button
              className="popup-button red"
              onClick={() =>
                handleChangeSpellColor(menuOpen.heroKey!, "#e74c3c")
              }
            >
              Red
            </button>
            <button
              className="popup-button green"
              onClick={() =>
                handleChangeSpellColor(menuOpen.heroKey!, "#2ecc71")
              }
            >
              Green
            </button>
            <button
              className="popup-button yellow"
              onClick={() =>
                handleChangeSpellColor(menuOpen.heroKey!, "#f1c40f")
              }
            >
              Yellow
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "10px", color: "#2c3e50" }}>
              Скорость движения
            </h4>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={heroesRef.current[menuOpen.heroKey!].speed}
              onChange={(e) =>
                handleSliderChange(
                  menuOpen.heroKey!,
                  "speed",
                  parseFloat(e.target.value)
                )
              }
              style={{
                width: "100%",
                accentColor: "#3498db",
                transition: "accent-color 0.3s ease",
              }}
            />
          </div>

          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "10px", color: "#2c3e50" }}>
              Скорость заклинаний
            </h4>
            <input
              type="range"
              min="100"
              max="3000"
              step="100"
              value={
                3000 - heroesRef.current[menuOpen.heroKey!].spellCastingSpeed
              }
              onChange={(e) =>
                handleSliderChange(
                  menuOpen.heroKey!,
                  "spellCastingSpeed",
                  parseFloat(e.target.value)
                )
              }
              style={{
                width: "100%",
                accentColor: "#e74c3c",
                transition: "accent-color 0.3s ease",
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Game;
