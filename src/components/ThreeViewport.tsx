import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { VSEPRShape } from '../sim/vsepr'
import type { BlackHoleParams } from '../sim/blackhole'

type Props = {
  kind:'vsepr'|'bh'
  shape?:VSEPRShape
  blackHole?:BlackHoleParams
  highlightId?:string
  onSelect?:(id:string)=>void
  className?:string
}

export function ThreeViewport({ kind, shape, blackHole, highlightId, onSelect, className }:Props){
  const ref = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    if(!ref.current) return
    const width = ref.current.clientWidth || 400
    const height = ref.current.clientHeight || 260
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#020309')
    const camera = new THREE.PerspectiveCamera(45, width/height, 0.1, 100)
    camera.position.set(0,0,12)
    const renderer = new THREE.WebGLRenderer({ antialias:true })
    renderer.setSize(width, height)
    ref.current.appendChild(renderer.domElement)

    const light = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(light)
    const dir = new THREE.DirectionalLight(0xffffff, 0.6)
    dir.position.set(5,5,5)
    scene.add(dir)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enablePan = false

    const group = new THREE.Group()
    scene.add(group)

    const interactive: THREE.Object3D[] = []
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    if(kind==='vsepr' && shape){
      const center = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 32, 32),
        new THREE.MeshStandardMaterial({ color:'#f9fafb' })
      )
      group.add(center)

      shape.positions.forEach(pos=>{
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.4, 32, 32),
          new THREE.MeshStandardMaterial({ color: highlightId===pos.id?'#f3b86c':'#9ca3af' })
        )
        sphere.position.set(pos.xyz[0], pos.xyz[1], pos.xyz[2])
        sphere.userData = { id: pos.id }
        group.add(sphere)
        interactive.push(sphere)

        const points = [
          new THREE.Vector3(0,0,0),
          new THREE.Vector3(pos.xyz[0], pos.xyz[1], pos.xyz[2])
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color:'#f9fafb' }))
        group.add(line)
      })
    }else if(kind==='bh' && blackHole){
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(1.1,32,32),
        new THREE.MeshBasicMaterial({ color:'#000000' })
      )
      group.add(core)

      const inner = Math.max(1.3, 1.3 + (1-blackHole.spin)*0.8)
      const outer = 6
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, 128),
        new THREE.MeshBasicMaterial({ color:'#f9fafb', side:THREE.DoubleSide, transparent:true, opacity:0.35 })
      )
      ring.rotation.x = Math.PI/2.5
      group.add(ring)

      const particlesGeometry = new THREE.BufferGeometry()
      const count = 200
      const positions = new Float32Array(count*3)
      for(let i=0;i<count;i++){
        const radius = inner + Math.random()*(outer-inner)
        const angle = Math.random()*Math.PI*2
        positions[i*3] = radius*Math.cos(angle)
        positions[i*3+1] = (Math.random()-0.5)*0.5
        positions[i*3+2] = radius*Math.sin(angle)
      }
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions,3))
      const particles = new THREE.Points(
        particlesGeometry,
        new THREE.PointsMaterial({ color:'#f9fafb', size:0.1 })
      )
      group.add(particles)
    }

    let frameId: number
    const animate = ()=>{
      group.rotation.y += 0.005
      if(kind==='bh'){
        group.rotation.x = Math.sin(performance.now()*0.0002)*0.1
      }
      controls.update()
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const handleResize = ()=>{
      if(!ref.current) return
      const w = ref.current.clientWidth
      const h = ref.current.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w/h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', handleResize)

    function handlePointer(ev:PointerEvent){
      if(!interactive.length || !onSelect) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left)/rect.width)*2 - 1
      pointer.y = -((ev.clientY - rect.top)/rect.height)*2 + 1
      raycaster.setFromCamera(pointer, camera)
      const target = raycaster.intersectObjects(interactive, false)[0]
      if(target?.object?.userData?.id){
        onSelect(target.object.userData.id)
      }
    }
    renderer.domElement.addEventListener('pointerdown', handlePointer)

    return ()=>{
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', handlePointer)
      renderer.dispose()
      ref.current?.removeChild(renderer.domElement)
    }
  }, [kind, shape, blackHole, highlightId, onSelect])

  return <div ref={ref} className={className} style={{width:'100%', height:'100%'}} />
}
