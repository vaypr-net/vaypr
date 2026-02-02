import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { ExpenseService } from './expense.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Expense created successfully' })
  @UseInterceptors(FileInterceptor('receipt'))
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
    @Request() req,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    let receiptUrl: string | undefined;

    if (receipt) {
      const uploadResult = await this.cloudinaryService.uploadImage(receipt);
      receiptUrl = uploadResult.secure_url;
    }

    return this.expenseService.create(
      createExpenseDto,
      req.user.userId,
      receiptUrl,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all expenses with optional filters' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Expenses retrieved successfully' })
  async findAll(
    @Request() req,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseService.findAll(
      req.user.userId,
      category,
      startDate,
      endDate,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get expense statistics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter from date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter to date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.expenseService.getStats(req.user.userId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiResponse({ status: 200, description: 'Expense retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.expenseService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Expense updated successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  @UseInterceptors(FileInterceptor('receipt'))
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
    @Request() req,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    let receiptUrl: string | undefined;

    if (receipt) {
      const uploadResult = await this.cloudinaryService.uploadImage(receipt);
      receiptUrl = uploadResult.secure_url;
    }

    return this.expenseService.update(
      id,
      updateExpenseDto,
      req.user.userId,
      receiptUrl,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiResponse({ status: 200, description: 'Expense deleted successfully' })
  @ApiResponse({ status: 404, description: 'Expense not found' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.expenseService.remove(id, req.user.userId);
  }
}
