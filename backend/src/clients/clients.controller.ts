import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { PaginatedClientsDto } from './dto/paginated-clients.dto';
import { CreateClientNoteDto, ClientNoteResponseDto } from './dto/client-note.dto';
import { ClientActivityResponseDto } from './dto/client-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BulkOperationDto, BulkOperationResponseDto } from './dto/bulk-operations.dto';

@ApiTags('Clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Client created successfully',
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createClientDto: CreateClientDto, @Request() req): Promise<ClientResponseDto> {
    const userId = req.user?.id || null;
    return this.clientsService.create(createClientDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order (asc/desc)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clients retrieved successfully',
    type: PaginatedClientsDto,
  })
  async findAll(@Request() req, @Query() query: QueryClientsDto): Promise<PaginatedClientsDto> {
    console.log('Controller: findAll called with user:', req.user);
    console.log('Controller: query params:', query);
    
    // Temporarily bypass user filtering for debugging
    const result = await this.clientsService.findAll(undefined, query);
    console.log('Controller: result:', result);
    return result;
  }

  @Get('simple')
  @ApiOperation({ summary: 'Get all clients (simple list)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Clients retrieved successfully',
    type: [ClientResponseDto],
  })
  async findAllSimple(@Request() req): Promise<ClientResponseDto[]> {
    const userId = req.user?.id || null;
    return this.clientsService.findAllSimple(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get client statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client statistics retrieved successfully',
  })
  async getStats(@Request() req) {
    const userId = req.user?.id || null;
    return this.clientsService.getClientStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client retrieved successfully',
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  async findOne(@Param('id') id: string, @Request() req): Promise<ClientResponseDto> {
    const userId = req.user?.id || null;
    return this.clientsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a client' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client updated successfully',
    type: ClientResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
    @Request() req,
  ): Promise<ClientResponseDto> {
    const userId = req.user?.id || null;
    return this.clientsService.update(id, updateClientDto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Client not found',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    const userId = req.user?.id || null;
    await this.clientsService.remove(id, userId);
    return { message: 'Client deleted successfully' };
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk operations on clients' })
  @ApiResponse({
    status: 200,
    description: 'Bulk operation completed',
    type: BulkOperationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid bulk operation request',
  })
  async bulkOperation(@Body() bulkOperationDto: BulkOperationDto, @Request() req): Promise<BulkOperationResponseDto> {
    const userId = req.user?.id || null;
    return this.clientsService.bulkOperation(bulkOperationDto, userId);
  }

  // Client Notes endpoints
  @Get(':id/notes')
  @ApiOperation({ summary: 'Get client notes' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client notes retrieved successfully',
    type: [ClientNoteResponseDto],
  })
  async getClientNotes(@Param('id') id: string, @Request() req): Promise<ClientNoteResponseDto[]> {
    const userId = req.user?.id || null;
    return this.clientsService.getClientNotes(id, userId);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add a note to client' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Note added successfully',
    type: ClientNoteResponseDto,
  })
  async addClientNote(
    @Param('id') id: string,
    @Body() createNoteDto: CreateClientNoteDto,
    @Request() req
  ): Promise<ClientNoteResponseDto> {
    const userId = req.user?.id || null;
    const userName = req.user?.name || req.user?.email || 'Unknown User';
    return this.clientsService.addClientNote(id, createNoteDto, userId, userName);
  }

  // Client Activity endpoints
  @Get(':id/activity')
  @ApiOperation({ summary: 'Get client activity timeline' })
  @ApiParam({ name: 'id', description: 'Client ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Client activity retrieved successfully',
    type: [ClientActivityResponseDto],
  })
  async getClientActivity(@Param('id') id: string, @Request() req): Promise<ClientActivityResponseDto[]> {
    const userId = req.user?.id || null;
    return this.clientsService.getClientActivity(id, userId);
  }
}