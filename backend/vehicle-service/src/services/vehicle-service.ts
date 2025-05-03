import { Logger } from 'winston';
import Vehicle, { IVehicle } from '../models/vehicle';
import KafkaService from './kafka-service';

class VehicleService {
  private logger: Logger;
  private kafkaService: KafkaService;

  constructor(logger: Logger) {
    this.logger = logger;
    this.kafkaService = new KafkaService(logger);
    
    // Try to connect to Kafka but don't block service startup if it fails
    this.kafkaService.connect().catch(err => {
      this.logger.warn(`Initial Kafka connection failed: ${err}. Will retry on first event.`);
    });
  }

  // Get all vehicles with optional filtering
  public async getAllVehicles(
    filter: Record<string, any> = {},
    limit: number = 100,
    skip: number = 0,
    sort: Record<string, any> = { createdAt: -1 }
  ): Promise<IVehicle[]> {
    try {
      const vehicles = await Vehicle.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      return vehicles;
    } catch (error) {
      this.logger.error(`Error fetching vehicles: ${error}`);
      throw error;
    }
  }

  // Get a single vehicle by ID
  public async getVehicleById(id: string): Promise<IVehicle | null> {
    try {
      const vehicle = await Vehicle.findById(id);
      return vehicle;
    } catch (error) {
      this.logger.error(`Error fetching vehicle ${id}: ${error}`);
      throw error;
    }
  }

  // Create a new vehicle
  public async createVehicle(vehicleData: Partial<IVehicle>): Promise<IVehicle> {
    try {
      const vehicle = new Vehicle(vehicleData);
      const savedVehicle = await vehicle.save();
      
      // Publish the creation event
      try {
        await this.kafkaService.publishVehicleCreated(savedVehicle);
      } catch (kafkaError) {
        this.logger.error(`Failed to publish vehicle created event: ${kafkaError}`);
        // We don't want to fail the API call if Kafka is down
      }
      
      return savedVehicle;
    } catch (error) {
      this.logger.error(`Error creating vehicle: ${error}`);
      throw error;
    }
  }

  // Update a vehicle
  public async updateVehicle(id: string, updates: Partial<IVehicle>): Promise<IVehicle | null> {
    try {
      // Get the current vehicle to check for status changes
      const currentVehicle = await Vehicle.findById(id);
      
      if (!currentVehicle) {
        return null;
      }
      
      const previousStatus = currentVehicle.status;
      
      // Apply updates
      Object.keys(updates).forEach(key => {
        // Need to use any type here since we're dynamically accessing properties
        (currentVehicle as any)[key] = (updates as any)[key];
      });
      
      const updatedVehicle = await currentVehicle.save();
      
      // Publish the update event
      try {
        await this.kafkaService.publishVehicleUpdated(updatedVehicle);
        
        // If status changed, publish the status change event
        if (previousStatus !== updatedVehicle.status) {
          await this.kafkaService.publishVehicleStatusChanged(updatedVehicle, previousStatus);
        }
      } catch (kafkaError) {
        this.logger.error(`Failed to publish vehicle update event: ${kafkaError}`);
      }
      
      return updatedVehicle;
    } catch (error) {
      this.logger.error(`Error updating vehicle ${id}: ${error}`);
      throw error;
    }
  }

  // Delete a vehicle
  public async deleteVehicle(id: string): Promise<boolean> {
    try {
      const result = await Vehicle.findByIdAndDelete(id);
      
      if (result) {
        // Publish the deletion event
        try {
          await this.kafkaService.publishVehicleDeleted(id);
        } catch (kafkaError) {
          this.logger.error(`Failed to publish vehicle deleted event: ${kafkaError}`);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Error deleting vehicle ${id}: ${error}`);
      throw error;
    }
  }

  // Get count of vehicles by type
  public async getVehicleCountByType(): Promise<Record<string, number>> {
    try {
      const result = await Vehicle.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Convert array to object
      const countByType: Record<string, number> = {};
      result.forEach(item => {
        countByType[item._id] = item.count;
      });
      
      return countByType;
    } catch (error) {
      this.logger.error(`Error getting vehicle count by type: ${error}`);
      throw error;
    }
  }

  // Get count of vehicles by status
  public async getVehicleCountByStatus(): Promise<Record<string, number>> {
    try {
      const result = await Vehicle.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Convert array to object
      const countByStatus: Record<string, number> = {};
      result.forEach(item => {
        countByStatus[item._id] = item.count;
      });
      
      return countByStatus;
    } catch (error) {
      this.logger.error(`Error getting vehicle count by status: ${error}`);
      throw error;
    }
  }

  // Cleanup resources when service is shutting down
  public async cleanup(): Promise<void> {
    try {
      await this.kafkaService.disconnect();
    } catch (error) {
      this.logger.error(`Error during cleanup: ${error}`);
    }
  }
}

export default VehicleService; 