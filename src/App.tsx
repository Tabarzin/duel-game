import "./App.css";
import Game from "./Components/Game/Game";

function App() {
  return (
    <main className="app">
      <h1 className="h1">
        ДУ<span className="blue-text">ЭЛЬ</span>
      </h1>
      <Game />
      <div className="instructions">
        <h4>Как играть</h4>
        <ul>
          <li>
            Чтобы изменить направление движения, кликайте над или под кругом
          </li>
          <li>
            Чтобы изменить скорость движения, цвет и скорость заклинаний,
            кликните на сам круг
          </li>
        </ul>
      </div>
    </main>
  );
}

export default App;
