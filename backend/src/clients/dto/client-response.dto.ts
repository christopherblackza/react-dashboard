import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus } from './create-client.dto';

export class ClientResponseDto {
  @ApiProperty({
    description: 'Client ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Client name',
    example: 'Acme Corporation',
  })
  name: string;

  @ApiProperty({
    description: 'Client email address',
    example: 'contact@acme.com',
  })
  email: string;

  @ApiProperty({
    description: 'Client phone number',
    example: '+1-555-0123',
    required: false,
  })
  phone?: string;

  @ApiProperty({
    description: 'Client company name',
    example: 'Acme Corporation',
    required: false,
  })
  company?: string;

  @ApiProperty({
    description: 'Client status',
    enum: ClientStatus,
    example: ClientStatus.ACTIVE,
  })
  status: ClientStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updated_at: string;
}