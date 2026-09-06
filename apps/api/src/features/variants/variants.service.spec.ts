import { VariantsService } from './variants.service';

describe('VariantsService', () => {
  let service: VariantsService;
  let mockVariantsRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockVariantsRepo = {
      findByProduct: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      countByProduct: jest.fn(),
    };
    service = new VariantsService(mockVariantsRepo as never);
  });

  it('delegates findByProduct to the repository', async () => {
    mockVariantsRepo.findByProduct.mockResolvedValue([
      { id: 'var-1', productId: 'prod-1' },
    ]);

    await expect(service.findByProduct('prod-1')).resolves.toEqual([
      { id: 'var-1', productId: 'prod-1' },
    ]);
    expect(mockVariantsRepo.findByProduct).toHaveBeenCalledWith('prod-1');
  });

  it('delegates findOne and surfaces null when the variant does not exist', async () => {
    mockVariantsRepo.findById.mockResolvedValue(null);

    await expect(service.findOne('var-1')).resolves.toBeNull();
    expect(mockVariantsRepo.findById).toHaveBeenCalledWith('var-1');
  });

  it('delegates create with the validated input', async () => {
    const input = {
      productId: 'prod-1',
      size: 'L',
      color: 'Rojo',
      barcode: '7789',
      sku: 'CAM-L-R',
      price_cents: 4500,
      cost_cents: 2000,
    };
    mockVariantsRepo.create.mockResolvedValue({ id: 'var-1' });

    await service.create(input);

    expect(mockVariantsRepo.create).toHaveBeenCalledWith(input);
  });

  it('delegates update and remove to the repository', async () => {
    mockVariantsRepo.update.mockResolvedValue({ id: 'var-1' });
    mockVariantsRepo.remove.mockResolvedValue({ id: 'var-1' });

    await service.update('var-1', { price_cents: 5000 });
    await service.remove('var-1');

    expect(mockVariantsRepo.update).toHaveBeenCalledWith('var-1', {
      price_cents: 5000,
    });
    expect(mockVariantsRepo.remove).toHaveBeenCalledWith('var-1');
  });

  it('delegates countByProduct to the repository', async () => {
    mockVariantsRepo.countByProduct.mockResolvedValue(3);

    await expect(service.countByProduct('prod-1')).resolves.toBe(3);
  });
});