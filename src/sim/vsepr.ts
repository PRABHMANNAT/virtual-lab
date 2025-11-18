export type VSEPRShapeId =
  | 'linear'
  | 'trigonal_planar'
  | 'tetrahedral'
  | 'trigonal_bipyramidal'
  | 'octahedral'

export type VSEPRShape = {
  id: VSEPRShapeId
  title: string
  electronPairs: number
  lonePairs: number
  hybridization: string
  bondAngle: number
  positions: Array<{ id:string, xyz:[number,number,number] }>
  description: string
}

const baseRadius = 2

export const SHAPES: Record<VSEPRShapeId, VSEPRShape> = {
  linear: {
    id:'linear',
    title:'Linear (AX₂)',
    electronPairs:2,
    lonePairs:0,
    hybridization:'sp',
    bondAngle:180,
    positions:[
      {id:'A1', xyz:[-baseRadius,0,0]},
      {id:'A2', xyz:[baseRadius,0,0]},
    ],
    description:'Two electron groups. Example: CO₂.'
  },
  trigonal_planar:{
    id:'trigonal_planar',
    title:'Trigonal planar (AX₃)',
    electronPairs:3,
    lonePairs:0,
    hybridization:'sp²',
    bondAngle:120,
    positions:[
      {id:'A1', xyz:[Math.cos(0)*baseRadius, Math.sin(0)*baseRadius, 0]},
      {id:'A2', xyz:[Math.cos(2*Math.PI/3)*baseRadius, Math.sin(2*Math.PI/3)*baseRadius, 0]},
      {id:'A3', xyz:[Math.cos(4*Math.PI/3)*baseRadius, Math.sin(4*Math.PI/3)*baseRadius, 0]},
    ],
    description:'Three electron groups in one plane. Example: BF₃.'
  },
  tetrahedral:{
    id:'tetrahedral',
    title:'Tetrahedral (AX₄)',
    electronPairs:4,
    lonePairs:0,
    hybridization:'sp³',
    bondAngle:109.5,
    positions:[
      {id:'A1', xyz:[baseRadius,0,0]},
      {id:'A2', xyz:[-baseRadius/3, baseRadius*0.94,0]},
      {id:'A3', xyz:[-baseRadius/3, -baseRadius*0.47, baseRadius*0.82]},
      {id:'A4', xyz:[-baseRadius/3, -baseRadius*0.47, -baseRadius*0.82]},
    ],
    description:'Four bonding pairs. Example: CH₄.'
  },
  trigonal_bipyramidal:{
    id:'trigonal_bipyramidal',
    title:'Trigonal bipyramidal (AX₅)',
    electronPairs:5,
    lonePairs:0,
    hybridization:'sp³d',
    bondAngle:120,
    positions:[
      {id:'A1', xyz:[0,0,baseRadius*1.2]},
      {id:'A2', xyz:[0,0,-baseRadius*1.2]},
      {id:'A3', xyz:[baseRadius,0,0]},
      {id:'A4', xyz:[Math.cos(2*Math.PI/3)*baseRadius, Math.sin(2*Math.PI/3)*baseRadius,0]},
      {id:'A5', xyz:[Math.cos(4*Math.PI/3)*baseRadius, Math.sin(4*Math.PI/3)*baseRadius,0]},
    ],
    description:'Five electron groups with axial and equatorial positions. Example: PCl₅.'
  },
  octahedral:{
    id:'octahedral',
    title:'Octahedral (AX₆)',
    electronPairs:6,
    lonePairs:0,
    hybridization:'sp³d²',
    bondAngle:90,
    positions:[
      {id:'A1', xyz:[baseRadius,0,0]},
      {id:'A2', xyz:[-baseRadius,0,0]},
      {id:'A3', xyz:[0,baseRadius,0]},
      {id:'A4', xyz:[0,-baseRadius,0]},
      {id:'A5', xyz:[0,0,baseRadius]},
      {id:'A6', xyz:[0,0,-baseRadius]},
    ],
    description:'Six bonding pairs around the central atom. Example: SF₆.'
  }
}

export function getShape(id:VSEPRShapeId){
  return SHAPES[id] || SHAPES.linear
}

export function listShapes(){ return Object.values(SHAPES) }
