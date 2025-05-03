// Mock vehicle data for testing
export const mockVehicles = [
  {
    id: '60d21b4667d0d8992e610c85',
    model: 'CAT 336',
    type: 'excavator',
    status: 'active',
    registrationDate: '2023-01-15T08:30:00Z',
    metadata: {
      year: 2022,
      manufacturer: 'Caterpillar',
      fuelType: 'diesel',
      capacity: 36,
      vin: '4Y1SL65848Z411439'
    },
    createdAt: '2023-01-15T08:30:00Z',
    updatedAt: '2023-01-15T08:30:00Z'
  },
  {
    id: '60d21b4667d0d8992e610c86',
    model: 'Volvo FH16',
    type: 'truck',
    status: 'maintenance',
    registrationDate: '2023-02-15T10:30:00Z',
    metadata: {
      year: 2021,
      manufacturer: 'Volvo',
      fuelType: 'diesel',
      capacity: 16,
      vin: '9B2SL65999Z422101'
    },
    createdAt: '2023-02-15T10:30:00Z',
    updatedAt: '2023-05-20T14:15:00Z'
  }
];

// New vehicle for POST testing
export const newVehicle = {
  model: 'Komatsu PC210',
  type: 'excavator',
  status: 'inactive',
  metadata: {
    year: 2023,
    manufacturer: 'Komatsu',
    fuelType: 'diesel',
    capacity: 21,
    vin: '7G3TM27654D983211'
  }
};

// Updates for PUT testing
export const vehicleUpdate = {
  status: 'active',
  metadata: {
    fuelType: 'biodiesel',
    capacity: 22
  }
};

// Mock vehicle response formatters
export const formatVehicleResponse = (vehicle: any) => ({
  status: 'success',
  data: vehicle
});

export const formatVehiclesResponse = (vehicles: any[]) => ({
  status: 'success',
  count: vehicles.length,
  data: vehicles
});

export const formatDeleteResponse = () => ({
  status: 'success',
  message: 'Vehicle deleted successfully'
}); 