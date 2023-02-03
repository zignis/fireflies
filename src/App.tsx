import React from 'react';
import Particles from "./particles";

function App() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const particles = new Particles(
        canvasRef.current,
        "dark"
    );

    return () => particles.destroy();
  }, []);

  return (
    <main>
      <canvas ref={canvasRef} />
    </main>
  );
}

export default App;
