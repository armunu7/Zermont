import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Image,
  ImageBackground,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity
} from "react-native";

export default function App() {
  const [playerpos, setplayerpos] = useState({ x: 400, y: 300 });
  const [enemies, setEnemies] = useState([]);
  const [hitEffect, setHitEffect] = useState(false);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const keysPressed = useRef({});
  const playerPosRef = useRef({ x: 400, y: 300 });
  const handleAttackRef = useRef(null);
  const damageCooldownRef = useRef(false);
  const [score, setScore] = useState(0);
  const [attackCooldown, setAttackCooldown] = useState(false);
  const [screen, setscreen] = useState("home");
  const ENEMY_DAMAGE = 2;

  const [wave, setWave] = useState(1);
  const [waveStarting, setWaveStarting] = useState(false);

  const spawnWave = (waveNumber) => {
    const newEnemies = [];
    if (waveNumber % 5 === 0) {
      newEnemies.push({
        id: Date.now() + Math.random(),
        x: 350,
        y: 200,
        health: 300 + waveNumber * 20,
        isBoss: true
      });
    } else {
      const enemyCount = waveNumber * 2 - 1;
      for (let i = 0; i < enemyCount; i++) {
        newEnemies.push({
          id: Date.now() + Math.random() + i,
          x: Math.random() * 700 + 50,
          y: Math.random() * 500 + 50,
          health: 50 + waveNumber * 5
        });
      }
    }
    setEnemies(newEnemies);
  };

  useEffect(() => {
    spawnWave(1);
  }, []);

  useEffect(() => {
    if (!gameOver && enemies.length === 0 && !waveStarting) {
      setWaveStarting(true);
      setTimeout(() => {
        const nextWave = wave + 1;
        setWave(nextWave);
        spawnWave(nextWave);
        setWaveStarting(false);
      }, 2000);
    }
  }, [enemies]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setEnemies(current =>
        current.map(enemy => {
          const dx = playerPosRef.current.x - enemy.x;
          const dy = playerPosRef.current.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const speed = 2.5;

          let newX = enemy.x + (dx / distance) * speed;
          let newY = enemy.y + (dy / distance) * speed;

          if (distance < 60 && !damageCooldownRef.current) {
            setPlayerHealth(prev => {
              const newHealth = prev - ENEMY_DAMAGE;
              if (newHealth <= 0) setGameOver(true);
              return newHealth;
            });
            damageCooldownRef.current = true;
            setTimeout(() => { damageCooldownRef.current = false; }, 1000);
          }

          newX = Math.max(20, Math.min(750, newX));
          newY = Math.max(20, Math.min(550, newY));

          return { ...enemy, x: newX, y: newY };
        })
      );
    }, 30);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = e => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === " ") {
        e.preventDefault();
        handleAttackRef.current?.();
      }
    };
    const handleKeyUp = e => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const loop = setInterval(() => {
      const keys = keysPressed.current;
      setplayerpos(pos => {
        const speed = 5;
        let { x, y } = pos;
        if (keys["w"]) y -= speed;
        if (keys["s"]) y += speed;
        if (keys["a"]) x -= speed;
        if (keys["d"]) x += speed;
        x = Math.max(20, Math.min(750, x));
        y = Math.max(20, Math.min(550, y));
        playerPosRef.current = { x, y };
        return { x, y };
      });
    }, 16);
    return () => clearInterval(loop);
  }, [gameOver]);

  const getDistance = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleAttack = () => {
    if (gameOver || attackCooldown) return;
    setAttackCooldown(true);

    setEnemies(current => {
      let killed = 0;
      const updated = current
        .map(enemy => {
          const distance = getDistance(playerPosRef.current, enemy);
          if (distance < 90) {
            const newHealth = enemy.health - 50;
            if (newHealth <= 0) { killed++; return null; }
            return { ...enemy, health: newHealth };
          }
          return enemy;
        })
        .filter(Boolean);

      if (killed > 0) {
        setScore(prev => prev + killed * 100);
        setHitEffect(true);
        setTimeout(() => setHitEffect(false), 200);
      }
      return updated;
    });

    setTimeout(() => setAttackCooldown(false), 100);
  };

  handleAttackRef.current = handleAttack;

  const restartGame = () => {
    setPlayerHealth(100);
    setEnemies([]);
    setScore(0);
    setWave(1);
    setGameOver(false);
    setplayerpos({ x: 400, y: 300 });
    playerPosRef.current = { x: 400, y: 300 };
    spawnWave(1);
  };

  if (screen === "home")
    return (
      <ImageBackground
        source={require("./imageforzermont.jpg")}
        style={{ flex: 1, backgroundColor: "red", justifyContent: 'flex-end' }}
        resizeMode="cover"
      >
        <TouchableOpacity onPress={() => setscreen('game')} style={styles.restartButton}>
          <Text style={{ color: "white", fontSize: 40, textAlign: 'center' }}>Play</Text>
        </TouchableOpacity>
      </ImageBackground>
    );

  if (screen === "game")
    return (
      <ImageBackground
        source={require("./fightinggamebackground.jpg")}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.ui}>
          <View style={styles.topRow}>
            <Text style={{ color: "white" }}>YOU: {playerHealth}%</Text>
            <Text style={{ color: "cyan", fontSize: 20 }}>Wave: {wave}</Text>
            <Text style={{ color: "gold", fontSize: 20 }}>Score: {score}</Text>
          </View>
          {waveStarting && (
            <Text style={{ color: "yellow", textAlign: "center" }}>
              NEXT WAVE INCOMING...
            </Text>
          )}
          <Text style={{ color: "white", textAlign: "center" }}>
            Enemies: {enemies.length} | SPACE to attack
          </Text>
        </View>

        {hitEffect && (
          <View style={styles.hitText}>
            <Text style={{ color: "red", fontSize: 48, fontWeight: "bold" }}>HIT!</Text>
          </View>
        )}

        {gameOver && (
          <View style={styles.gameOver}>
            <View style={styles.gameOverBox}>
              <Text style={{ fontSize: 48, fontWeight: "bold", color: "red" }}>GAME OVER!</Text>
              <Text style={{ fontSize: 32, marginBottom: 20 }}>Score: {score}</Text>
              <TouchableOpacity onPress={restartGame} style={styles.restartButton}>
                <Text style={{ color: "white", fontSize: 24 }}>Play Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Animated.View style={[styles.player, { left: playerpos.x, top: playerpos.y }]}>
          <Image
            source={require("./Characters/Untitled_design-removebg-preview.png")}
            style={styles.character}
          />
        </Animated.View>

        {enemies.map(enemy => (
          <Animated.View key={enemy.id} style={[styles.enemy, { left: enemy.x, top: enemy.y }]}>
            <Text style={styles.enemyHP}>{enemy.health} HP</Text>
            <Image
              source={
                enemy.isBoss
                  ? require("./Characters/ChatGPT_Image_Jan_20__2026__06_35_55_PM-removebg-preview.png")
                  : require("./Characters/Enemy2butbetter-removebg-preview.png")
              }
              style={styles.character}
            />
          </Animated.View>
        ))}
      </ImageBackground>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  player: { position: "absolute", alignItems: "center" },
  enemy: { position: "absolute", alignItems: "center" },
  character: { width: 100, height: 100, resizeMode: "contain" },
  ui: {
    position: "absolute", top: 20, left: 10, right: 10, zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.7)", padding: 10, borderRadius: 10
  },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  hitText: {
    position: "absolute", top: "50%", left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }], zIndex: 15
  },
  gameOver: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center",
    alignItems: "center", zIndex: 20
  },
  gameOverBox: {
    backgroundColor: "white", padding: 40, borderRadius: 20, alignItems: "center"
  },
  restartButton: { backgroundColor: "#4A90E2", padding: 15, borderRadius: 10 },
  enemyHP: { color: "white", backgroundColor: "rgba(0,0,0,0.5)", padding: 2 }
});
