// Common DTOs
import { IsNumber, IsOptional, IsMongoId, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsNumber()
  page!: number;

  @IsNumber()
  limit!: number;

  @IsNumber()
  total!: number;

  @IsNumber()
  totalPages!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  pagination!: PaginationDto;
}

export class ApiResponseDto<T> {
  success!: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class IdParamDto {
  @IsMongoId({ message: 'Invalid ID format' })
  id!: string;
}

export class PaginationQueryDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}

export class ActiveOnlyQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  activeOnly?: boolean = true;
}
