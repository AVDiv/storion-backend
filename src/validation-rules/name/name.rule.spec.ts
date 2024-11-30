import { describe, expect, it } from 'vitest';
import { IsName } from './name.rule';
import { validate } from 'class-validator';

class TestDto {
  @IsName()
  name: string;
}

describe('IsName Validator', () => {
  it('should pass for valid names', async () => {
    const dto = new TestDto();
    dto.name = 'John Doe';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail for names with numbers', async () => {
    const dto = new TestDto();
    dto.name = 'John123';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail for names with special characters', async () => {
    const dto = new TestDto();
    dto.name = 'John@Doe';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail for names shorter than 2 characters', async () => {
    const dto = new TestDto();
    dto.name = 'A';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass for names with spaces', async () => {
    const dto = new TestDto();
    dto.name = 'Mary Jane Watson';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});