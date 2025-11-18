export type XAPI = { actor:{name:string}, verb:string, object:string, result?:any, timestamp:string }
export const Telemetry = {
  store: [] as XAPI[],
  log(evt:{verb:string, object:string, result?:any}){
    const stmt: XAPI = { actor:{name:'learner'}, verb:evt.verb, object:evt.object, result:evt.result, timestamp:new Date().toISOString() }
    this.store.push(stmt)
    try{ localStorage.setItem('vlab_telemetry', JSON.stringify(this.store).slice(0, 2e6)) }catch{}
  },
  markX(x:number){
    // optional, could be used by Plot for markers; kept simple here
  },
  download(){
    const blob = new Blob([JSON.stringify(this.store, null, 2)], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='vlab_telemetry.json'; a.click()
    setTimeout(()=> URL.revokeObjectURL(url), 2000)
  }
}
export default Telemetry
