'use client'

import { CatmullRomCurve3, Vector3, RepeatWrapping, CanvasTexture } from 'three'
import type { Mesh, BufferGeometry } from 'three'
import type { ComponentRef, ComponentProps, RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei'
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier'
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  employeeInfoAtom,
  themeAtom,
  punchThemeAtom,
  punchThemeActiveIndexAtom,
  isInClockAtom,
  isPunchingAtom,
  isDraggingAtom
} from '@/store/atoms'
import type { EmployeeInfoResponse } from '@/lib/api/client'
import { cn } from '@/lib/utils'
// import { useControls } from 'leva'

type RigidBodyApi = ComponentRef<typeof RigidBody> & {
  lerped: Vector3
}
type RigidBodyProps = ComponentProps<typeof RigidBody>

extend({ MeshLineGeometry, MeshLineMaterial })

useGLTF.preload('/models/tag.glb')
useTexture.preload('/models/band.png')

export default function Badge({ className }: { className?: string }) {
  return (
    <div className={cn('h-full w-full', className)}>
      <Canvas
        className="badge-canvas touch-pan-x"
        camera={{ position: [0, 0, 15], fov: 25 }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

const Scene = () => {
  const { size, camera } = useThree()
  const cameraZ = Math.max(size.height / 80, 12)

  useEffect(() => {
    camera.position.set(0, 0, cameraZ)
  }, [cameraZ, camera])

  return (
    <>
      {/* <axesHelper /> */}
      <ambientLight intensity={Math.PI} />
      <Physics
        interpolate
        gravity={[0, -40, 0]}
        timeStep={1 / 60}
      >
        <Band />
      </Physics>
      <Environment blur={0.75}>
        <Lightformer
          intensity={20}
          color="white"
          position={[1, 0, 5]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={5}
          color="white"
          position={[-1, -1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={5}
          color="white"
          position={[1, 1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={10}
          color="white"
          position={[-10, 0, 14]}
          rotation={[0, Math.PI / 2, Math.PI / 3]}
          scale={[100, 10, 1]}
        />
      </Environment>
    </>
  )
}

const Band = ({ maxSpeed = 50, minSpeed = 10 }) => {
  const bandRef = useRef<Mesh>(null)
  const fixed = useRef<RigidBodyApi>(null!)
  const j1 = useRef<RigidBodyApi>(null!)
  const j2 = useRef<RigidBodyApi>(null!)
  const j3 = useRef<RigidBodyApi>(null!)
  const card = useRef<RigidBodyApi>(null!)
  const clockRef = useRef<HTMLElement | null>(null)
  const clockRefRect = useRef<DOMRect | undefined>(undefined)
  const vec = new Vector3()
  const ang = new Vector3()
  const rot = new Vector3()
  const dir = new Vector3()
  const segmentProps: RigidBodyProps = {
    type: 'dynamic',
    canSleep: true,
    colliders: false,
    angularDamping: 2,
    linearDamping: 2
  }
  const { nodes, materials } = useGLTF('/models/tag.glb')
  const texture = useTexture('/models/band.png')
  const employeeInfo = useAtomValue(employeeInfoAtom)
  const theme = useAtomValue(themeAtom)
  const punchTheme = useAtomValue(punchThemeAtom)
  const punchThemeActiveIndex = useAtomValue(punchThemeActiveIndexAtom)
  const [isInClock, setIsInClock] = useAtom(isInClockAtom)
  const setIsPunching = useSetAtom(isPunchingAtom)
  const setIsDragging = useSetAtom(isDraggingAtom)
  const [cardTexture, setCardTexture] = useState<CanvasTexture>()

  useEffect(() => {
    createStyledTextTexture(employeeInfo, theme, punchTheme[punchThemeActiveIndex]).then((texture) => {
      setCardTexture(texture)
    })
  }, [employeeInfo, theme, punchTheme, punchThemeActiveIndex])

  const cardMesh = nodes.card as Mesh<BufferGeometry>
  const clipMesh = nodes.clip as Mesh<BufferGeometry>
  const clampMesh = nodes.clamp as Mesh<BufferGeometry>

  const { width, height } = useThree((state) => state.size)
  const [curve] = useState(new CatmullRomCurve3([new Vector3(), new Vector3(), new Vector3(), new Vector3()]))
  const [dragged, setDragged] = useState<Vector3 | false>(false)
  const [hovered, setHovered] = useState(false)

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1])
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1])
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.45, 0]
  ])

  const lockScroller = useCallback(() => {
    const scroller = document.querySelector<HTMLElement>('.scene-scroller')
    const canvas = document.querySelector<HTMLCanvasElement>('.badge-canvas')
    if (scroller) {
      scroller.style.overflow = 'hidden'
    }
    if (canvas) {
      canvas.style.touchAction = 'none'
    }
  }, [])

  const unlockScroller = useCallback(() => {
    const scroller = document.querySelector<HTMLElement>('.scene-scroller')
    const canvas = document.querySelector<HTMLCanvasElement>('.badge-canvas')
    if (scroller) {
      scroller.style.removeProperty('overflow')
    }
    if (canvas) {
      canvas.style.removeProperty('touch-action')
    }
  }, [])

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera)
      dir.copy(vec).sub(state.camera.position).normalize()
      vec.add(dir.multiplyScalar(state.camera.position.length()))
      ;[card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp())
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z
      })

      if (card.current && clockRef.current && clockRefRect.current) {
        const cardPos = new Vector3()
        cardPos.copy(card.current.translation())

        const cardHalfWidth = 0.8
        const cardBottomY = cardPos.y - 1.125

        const canvas = document.querySelector('canvas')
        const canvasRect = canvas?.getBoundingClientRect()
        if (canvasRect) {
          const projectToScreen = (x: number, y: number) => {
            const worldPos = new Vector3(x, y, cardPos.z)
            const screenPos = worldPos.project(state.camera)
            return {
              x: canvasRect.left + ((screenPos.x + 1) / 2) * canvasRect.width,
              y: canvasRect.top + ((1 - screenPos.y) / 2) * canvasRect.height
            }
          }
          const cardBottom = projectToScreen(cardPos.x, cardBottomY)
          const cardLeft = projectToScreen(cardPos.x - cardHalfWidth, cardBottomY)
          const cardRight = projectToScreen(cardPos.x + cardHalfWidth, cardBottomY)

          const verticalCollision = cardBottom.y + 40 >= clockRefRect.current.bottom
          const overlapAmount =
            Math.min(cardRight.x, clockRefRect.current.right) - Math.max(cardLeft.x, clockRefRect.current.left)
          const horizontalCollision =
            cardRight.x > clockRefRect.current.right - 20 &&
            cardLeft.x < clockRefRect.current.left + 20 &&
            overlapAmount >= 10

          const isOverlapping = verticalCollision && horizontalCollision

          if (isOverlapping !== isInClock) {
            setIsInClock(isOverlapping)
          }
        }
      }
    }
    if (fixed.current && j1.current && j2.current && j3.current && card.current) {
      // Fix most of the jitter when over pulling the card
      ;([j1, j2] as unknown as RefObject<RigidBodyApi>[]).forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new Vector3().copy(ref.current.translation())
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())))
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)))
      })
      // Calculate catmul curve
      curve.points[0].copy(j3.current.translation())
      curve.points[1].copy(j2.current.lerped)
      curve.points[2].copy(j1.current.lerped)
      curve.points[3].copy(fixed.current.translation())
      if (bandRef.current) {
        const geometry = bandRef.current.geometry as { setPoints?: (points: Vector3[]) => void }
        geometry.setPoints?.(curve.getPoints(32))
      }
      // Tilt it back towards the screen
      ang.copy(card.current.angvel())
      rot.copy(card.current.rotation())
      if (card.current) {
        card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true)
      }
    }
  })

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab'
      return () => void (document.body.style.cursor = 'auto')
    }
  }, [hovered, dragged])

  curve.curveType = 'chordal'
  texture.wrapS = texture.wrapT = RepeatWrapping

  return (
    <>
      <group position={[0, 5.5, 0]}>
        <RigidBody
          ref={fixed}
          {...segmentProps}
          type="fixed"
        />
        <RigidBody
          position={[0.5, 0, 0]}
          ref={j1}
          {...segmentProps}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1, 0, 0]}
          ref={j2}
          {...segmentProps}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[1.5, 0, 0]}
          ref={j3}
          {...segmentProps}
        >
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.22, -0.05]}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onPointerDown={(e) => {
              ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
              lockScroller()
              setIsDragging(true)
              setDragged(new Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
              clockRef.current = document.querySelector<HTMLElement>('.punch-clock')
              clockRefRect.current = clockRef.current?.getBoundingClientRect()
            }}
            onPointerUp={async (e) => {
              ;(e.target as HTMLElement)?.releasePointerCapture?.(e.pointerId)
              unlockScroller()
              setDragged(false)
              setIsDragging(false)

              if (isInClock) {
                setIsPunching(true)
                setIsInClock(false)
              }
            }}
          >
            {cardTexture && (
              <mesh geometry={cardMesh.geometry}>
                <meshPhysicalMaterial
                  map={cardTexture}
                  anisotropy={16}
                  clearcoat={1}
                  clearcoatRoughness={0.15}
                  roughness={0.3}
                  metalness={0.8}
                />
              </mesh>
            )}
            <mesh
              geometry={clipMesh.geometry}
              material={materials.metal}
              material-roughness={0.3}
            />
            <mesh
              geometry={clampMesh.geometry}
              material={materials.metal}
            />
          </group>
        </RigidBody>
      </group>
      <mesh ref={bandRef}>
        {/* @ts-expect-error: meshLineGeometry is not typed */}
        <meshLineGeometry />
        {/* @ts-expect-error: meshLineMaterial is not typed */}
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={[width, height]}
          map={texture}
          useMap={1}
          repeat={[-3, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  )
}

const createStyledTextTexture = async (
  employeeInfo: EmployeeInfoResponse | null,
  theme: string,
  punchTheme: { primary: string; secondary: string }
) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!

  canvas.width = 1080
  canvas.height = 1024

  const cardWidth = canvas.width / 2
  const cardHeight = canvas.height - 248
  const bleed = 40

  const fontFamily = 'Afacad, Noto Sans TC, sans-serif'
  const backgroundColor = theme === 'light' ? '#ffffff' : '#1e1e1e'
  const primaryTextColor = theme === 'light' ? '#181818' : '#d1d1d1'
  const secondaryTextColor = theme === 'light' ? '#999999' : '#777777'

  // 載入背景圖片
  const loadBackgroundImage = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const svgContent = getBackgroundSvg(backgroundColor, punchTheme)
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = 'data:image/svg+xml,' + encodeURIComponent(svgContent)
    })
  }

  const loadTexture = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = '/models/card-texture.png'
    })
  }

  const drawBackground = async () => {
    try {
      const img = await loadBackgroundImage()
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
    } catch (error) {
      console.warn('Texture load failed:', error)
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
  }

  // 以 overlay 模式繪製紋理
  const drawTexture = async () => {
    try {
      const img = await loadTexture()
      context.globalCompositeOperation = 'overlay'
      context.globalAlpha = 1
      context.drawImage(img, 0, 0, canvas.width, canvas.height)
    } catch (error) {
      console.warn('Texture load failed:', error)
    }
  }

  // 文字
  const drawText = () => {
    drawDepName()
    drawName()
    drawEmpNo()
    drawHireDate()
  }

  const drawName = () => {
    context.font = `500 72px ${fontFamily}`
    context.fillStyle = primaryTextColor
    context.textAlign = 'left'
    context.textBaseline = 'bottom'
    context.fillText(employeeInfo?.name || '姓名', bleed, cardHeight - bleed)
  }

  const drawDepName = () => {
    context.font = `400 20px ${fontFamily}`
    context.fillStyle = secondaryTextColor
    context.textAlign = 'right'
    context.textBaseline = 'bottom'
    context.fillText(
      (employeeInfo?.depName === '開發' ? 'DEVELOPER' : employeeInfo?.positionName) || '',
      bleed + 72 * 3 - 4,
      cardHeight - bleed - 72 - 16
    )
  }

  const drawEmpNo = () => {
    context.font = `400 14px ${fontFamily}`
    context.fillStyle = secondaryTextColor
    context.textAlign = 'left'
    context.textBaseline = 'bottom'
    context.fillText(employeeInfo?.empNo || 'A00', bleed + 4, cardHeight - bleed - 72 - 20)
  }

  const drawHireDate = () => {
    context.font = `400 14px ${fontFamily}`
    context.fillStyle = secondaryTextColor
    context.textAlign = 'right'
    context.textBaseline = 'bottom'
    context.fillText(
      employeeInfo?.hireDate
        ? new Date(employeeInfo?.hireDate).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
        : '',
      cardWidth - bleed,
      cardHeight - bleed - 8
    )
  }

  await drawBackground()
  drawText()
  await drawTexture()

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = 'srgb'
  texture.flipY = false
  return texture
}

const getBackgroundSvg = (backgroundColor: string, punchTheme: { primary: string; secondary: string }) => {
  return `
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_2101_5)">
      <g filter="url(#filter0_f_2101_5)">
      <circle cx="362" cy="152" r="230" fill="url(#paint0_linear_2101_5)"/>
      </g>
      <path d="M362 9C440.984 9 505 73.0163 505 152C505 230.984 440.984 295 362 295C283.016 295 219 230.984 219 152C219 125.791 226.129 101.298 238.447 80.1855C235.581 76.4855 233.872 71.8452 233.872 66.8125C233.872 54.7462 243.685 44.9336 255.751 44.9336C259.048 44.9336 262.177 45.6673 264.983 46.9785C290.478 23.4132 324.543 9 362 9ZM491.019 188.567C480.51 201.199 464.68 209.255 447.003 209.255C442.736 209.255 438.577 208.784 434.574 207.895C433.091 243.689 409.665 273.822 377.394 285.191C431.894 278.964 476.455 240.069 491.019 188.567ZM348.892 127.24C306.346 127.24 271.856 161.731 271.855 204.276C271.855 246.822 306.353 281.312 348.892 281.312C391.112 281.312 425.41 247.337 425.922 205.231C404.761 196.819 389.763 176.135 389.763 152.014C389.763 147.825 390.214 143.741 391.072 139.806C378.955 131.862 364.463 127.24 348.892 127.24ZM362 17.9346C327.472 17.9346 296.027 31.0271 272.261 52.4697C275.604 56.3127 277.63 61.3297 277.63 66.8125C277.63 78.879 267.811 88.6914 255.751 88.6914C252.009 88.6914 248.483 87.7459 245.398 86.082C234.34 105.551 227.94 128.007 227.94 152C227.94 197.693 250.791 238.045 285.691 262.248C271.684 246.984 263.133 226.632 263.133 204.283C263.133 156.923 301.532 118.524 348.892 118.524C365.314 118.524 380.658 123.143 393.698 131.149C402.055 109.874 422.799 94.7726 447.003 94.7725C464.686 94.7725 480.521 102.834 491.029 115.473C475.128 59.1775 423.385 17.9346 362 17.9346ZM447.003 103.278C425.694 103.278 407.538 117.026 400.936 136.118C420.148 150.809 432.966 173.438 434.495 199.105C438.488 200.167 442.68 200.735 447.003 200.735C473.873 200.735 495.732 178.877 495.732 152.007C495.732 125.136 473.873 103.278 447.003 103.278ZM398.706 145.513C398.422 147.638 398.274 149.805 398.274 152.007C398.274 171.145 409.365 187.738 425.455 195.704C423.234 175.643 413.31 157.905 398.706 145.513ZM423.021 64.9746C428.114 64.9748 432.274 69.1215 432.274 74.2354C432.274 79.3423 428.114 83.4685 423.021 83.4688C417.893 83.4688 413.745 79.3424 413.745 74.2354C413.745 69.1214 417.893 64.9746 423.021 64.9746ZM255.751 53.793C248.567 53.793 242.732 59.6286 242.731 66.8125C242.731 73.9965 248.567 79.833 255.751 79.833C262.935 79.833 268.771 73.9965 268.771 66.8125C268.77 59.6286 262.935 53.793 255.751 53.793ZM398.758 55.6113C401.509 55.6113 403.756 57.8515 403.756 60.6094C403.756 63.3672 401.509 65.5937 398.758 65.5938C395.993 65.5938 393.753 63.3672 393.753 60.6094C393.753 57.8515 395.993 55.6113 398.758 55.6113ZM374.781 50.7832C376.361 50.7832 377.648 52.0706 377.648 53.6572C377.648 55.2368 376.354 56.5166 374.781 56.5166C373.195 56.5165 371.908 55.2436 371.908 53.6572C371.908 52.0639 373.195 50.7833 374.781 50.7832Z" fill="${backgroundColor}"/>
      <g opacity="0.15">
      <path d="M471.128 630.651L471.128 631.536L412.793 660L412.793 649.627L424.206 644.562L424.206 617.464L412.793 612.399L412.793 602.348L471.128 630.651ZM454.246 631.053L446.32 627.515L432.211 621.083L432.211 641.024L446.24 634.672L454.246 631.214L454.246 631.053Z" fill="url(#paint1_linear_2101_5)"/>
      <path d="M412.793 588.023L471.049 588.023L471.049 597.028L412.793 597.028L412.793 588.023Z" fill="url(#paint2_linear_2101_5)"/>
      <path d="M412.793 574.723L450.52 540.148L444.18 540.389L412.793 540.389L412.793 531.383L471.128 531.383L471.128 532.509L432.925 567.245L439.583 566.923L471.049 566.923L471.049 575.929L412.793 575.929L412.793 574.723Z" fill="url(#paint3_linear_2101_5)"/>
      <path d="M412 491.974C412 487.953 412.687 484.147 414.061 480.556C415.435 477.018 417.416 473.882 420.005 471.148C422.647 468.414 425.818 466.243 429.517 464.635C433.215 463.081 437.39 462.303 442.04 462.303C446.742 462.303 450.943 463.081 454.642 464.635C458.341 466.243 461.485 468.414 464.074 471.148C466.663 473.936 468.618 477.098 469.939 480.636C471.313 484.228 472 488.007 472 491.974C472 495.94 471.313 499.693 469.939 503.231C468.618 506.822 466.663 509.985 464.074 512.719C461.485 515.506 458.341 517.677 454.642 519.232C450.943 520.84 446.742 521.644 442.04 521.644C437.39 521.644 433.215 520.84 429.517 519.232C425.818 517.677 422.647 515.533 420.005 512.799C417.416 510.065 415.435 506.903 414.061 503.311C412.687 499.773 412 495.994 412 491.974ZM420.005 491.974C420.005 495.619 420.851 498.969 422.542 502.025C424.232 505.08 426.69 507.519 429.913 509.342C433.189 511.164 437.205 512.076 441.96 512.076C446.769 512.076 450.785 511.164 454.008 509.342C457.284 507.519 459.741 505.08 461.379 502.025C463.07 499.023 463.915 495.672 463.915 491.974C463.915 488.275 463.07 484.898 461.379 481.842C459.741 478.841 457.284 476.428 454.008 474.606C450.785 472.783 446.769 471.872 441.96 471.872C437.205 471.872 433.189 472.81 429.913 474.686C426.69 476.562 424.232 479.028 422.542 482.084C420.851 485.139 420.005 488.436 420.005 491.974Z" fill="url(#paint4_linear_2101_5)"/>
      <path d="M412 432.541C412 428.092 412.766 423.991 414.299 420.239C415.831 416.54 417.945 413.324 420.639 410.59C423.387 407.91 426.61 405.819 430.309 404.318C434.061 402.871 438.103 402.147 442.436 402.147C446.716 402.147 450.653 402.898 454.246 404.399C457.839 405.9 460.956 408.017 463.598 410.751C466.24 413.485 468.275 416.728 469.701 420.48C471.181 424.233 471.921 428.333 471.921 432.783C471.921 436.267 471.604 439.269 470.97 441.788C470.388 444.361 469.728 446.398 468.988 447.899C468.301 449.454 467.746 450.445 467.324 450.874L459.873 447.336C460.19 446.961 460.666 446.211 461.3 445.085C461.934 443.959 462.515 442.378 463.044 440.341C463.572 438.358 463.836 435.784 463.836 432.622C463.836 428.226 462.885 424.474 460.983 421.365C459.133 418.256 456.624 415.87 453.453 414.208C450.283 412.547 446.769 411.716 442.911 411.716C438.42 411.716 434.431 412.627 430.943 414.45C427.509 416.272 424.814 418.765 422.859 421.928C420.956 425.09 420.005 428.682 420.005 432.702C420.005 435.007 420.296 437.339 420.877 439.698C421.458 442.11 422.436 444.147 423.81 445.809L435.065 445.809L435.065 433.667L443.229 433.667L443.229 454.734L420.402 454.734C418.182 452.965 416.227 450.177 414.536 446.371C412.845 442.565 412 437.955 412 432.541Z" fill="url(#paint5_linear_2101_5)"/>
      <path d="M412.793 370.017L471.049 370.017L471.049 395.908L463.281 395.908L463.281 378.942L447.192 378.942L447.192 392.612L439.266 392.612L439.266 378.942L420.639 378.942L420.639 398.562L412.793 398.562L412.793 370.017Z" fill="url(#paint6_linear_2101_5)"/>
      <path d="M412.793 320L471.049 320L471.049 335.036C471.049 339.861 470.573 343.667 469.622 346.454C468.671 349.295 467.456 351.386 465.976 352.726C464.497 354.12 462.938 355.031 461.3 355.46C459.662 355.888 458.129 356.103 456.703 356.103C455.17 356.103 453.559 355.862 451.868 355.379C450.23 354.95 448.698 354.2 447.271 353.128C445.897 352.056 444.787 350.582 443.942 348.705C442.938 352.726 441.194 355.567 438.711 357.229C436.28 358.944 433.559 359.802 430.547 359.802C428.486 359.802 426.399 359.56 424.285 359.078C422.172 358.596 420.243 357.577 418.499 356.022C416.808 354.522 415.435 352.243 414.378 349.188C413.321 346.132 412.793 342.032 412.793 336.886L412.793 320ZM446.32 328.845L446.32 336.484C446.32 339.271 446.769 341.415 447.667 342.916C448.618 344.417 449.834 345.462 451.313 346.052C452.793 346.695 454.351 347.017 455.989 347.017C457.363 347.017 458.605 346.695 459.715 346.052C460.877 345.462 461.802 344.363 462.489 342.755C463.176 341.201 463.519 338.976 463.519 336.081L463.519 328.845L446.32 328.845ZM420.243 328.845L420.243 338.092C420.243 340.825 420.56 342.996 421.194 344.605C421.828 346.266 422.647 347.526 423.651 348.384C424.655 349.241 425.738 349.804 426.901 350.072C428.116 350.34 429.305 350.474 430.468 350.474C433.215 350.474 435.355 349.536 436.888 347.66C438.473 345.784 439.266 342.836 439.266 338.815L439.266 328.845L420.243 328.845Z" fill="url(#paint7_linear_2101_5)"/>
      </g>
      </g>
      <defs>
      <filter id="filter0_f_2101_5" x="32" y="-178" width="660" height="660" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
      <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_2101_5"/>
      </filter>
      <linearGradient id="paint0_linear_2101_5" x1="523" y1="-9.00002" x2="201" y2="313" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.secondary}"/>
      </linearGradient>
      <linearGradient id="paint1_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint2_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint3_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint4_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint5_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint6_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <linearGradient id="paint7_linear_2101_5" x1="499.483" y1="486.478" x2="390.501" y2="486.478" gradientUnits="userSpaceOnUse">
      <stop stop-color="${punchTheme.primary}"/>
      <stop offset="1" stop-color="${punchTheme.primary}" stop-opacity="0.3"/>
      </linearGradient>
      <clipPath id="clip0_2101_5">
      <rect width="1024" height="1024" fill="white"/>
      </clipPath>
      </defs>
    </svg>
  `
}
