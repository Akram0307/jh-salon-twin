import { ServicePopularityService } from './ServicePopularityService'
import { DemandForecastService } from './DemandForecastService'
import { ClientSegmentationService } from './ClientSegmentationService'

export class RevenueBrain {

  popularity = new ServicePopularityService()
  forecast = new DemandForecastService()
  segmentation = new ClientSegmentationService()

  async runNightly(salonId:string){

    console.log('RevenueBrain: recomputing service popularity')
    await this.popularity.recomputePopularity(salonId)

    console.log('RevenueBrain: generating demand forecasts')
    await this.forecast.generateSimpleForecast(salonId)

    console.log('RevenueBrain: computing client segments')
    await this.segmentation.computeSegments(salonId)

    console.log('RevenueBrain: completed nightly revenue optimization')
  }
}
