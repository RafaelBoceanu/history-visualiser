import { OrbitControls, Sky } from '@react-three/drei'

export function Scene() {
    return (
        <>
            <Sky sunPosition={[100, 40, 100]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[50, 80, 30]} intensity={1.5} castShadow />
            <mesh rotation-x={-Math.PI / 2} receiveShadow />
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#7a8a5a" />
            </mesh>
            <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[4, 2, 2]} />
                <meshStandardMaterial color="#b03030" /> 
            </mesh>
            <OrbitControls makeDefault maxPolarAngle={Math.PI / 2.2} />
        </>
    )
}