import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public decorator', () => {
  it('should return a function (decorator)', () => {
    const decorator = Public();
    expect(typeof decorator).toBe('function');
  });

  it('should set isPublic metadata on class when used as class decorator', () => {
    @Public()
    class TestClass {}

    const metadata = Reflect.getMetadata(IS_PUBLIC_KEY, TestClass);
    expect(metadata).toBe(true);
  });
});
