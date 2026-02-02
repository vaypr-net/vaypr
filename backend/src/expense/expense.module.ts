import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { Expense, ExpenseSchema } from './entities/expense.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
    CloudinaryModule,
  ],
  controllers: [ExpenseController],
  providers: [ExpenseService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
