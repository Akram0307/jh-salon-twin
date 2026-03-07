import { UpsellService } from './src/services/UpsellService'

async function run(){

  const upsells = await UpsellService.getUpsells('2bb87460-320b-42d8-9f07-3fbb659e6b0f')

  console.log('Upsells:', upsells)

}

run()
