
import logger from '../config/logger';
import { ServicePopularityService } from './ServicePopularityService'
import { DemandForecastService } from './DemandForecastService'
import { ClientSegmentationService } from './ClientSegmentationService'

export class RevenueBrain {

  popularity = new ServicePopularityService()
  forecast = new DemandForecastService()
  segmentation = new ClientSegmentationService()

  async runNightly(salonId:string){

    logger.info('RevenueBrain: recomputing service popularity')
    await this.popularity.recomputePopularity(salonId)

    logger.info('RevenueBrain: generating demand forecasts')
    await this.forecast.generateSimpleForecast(salonId)

    logger.info('RevenueBrain: computing client segments')
    await this.segmentation.computeSegments(salonId)

    logger.info('RevenueBrain: completed nightly revenue optimization')
  }
}
