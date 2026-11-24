import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'

export default function App() {
  return (
    <Canvas shadows camera={{ position: [30, 25, 30], fov: 45 }}>
      <Scene />
    </Canvas>
  )
}
