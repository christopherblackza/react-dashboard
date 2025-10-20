import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateClientNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  @IsNotEmpty()
  body: string;
}

export class ClientNoteResponseDto {
  @ApiProperty({ description: 'Note ID' })
  id: string;

  @ApiProperty({ description: 'Client ID' })
  client_id: string;

  @ApiProperty({ description: 'Author ID' })
  author_id: string;

  @ApiProperty({ description: 'Author name' })
  author_name: string;

  @ApiProperty({ description: 'Note content' })
  body: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;
}