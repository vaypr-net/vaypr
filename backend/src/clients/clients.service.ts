import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(@InjectModel(Client.name) private clientModel: Model<Client>) {}

  async create(userId: string, createClientDto: CreateClientDto): Promise<Client> {
    const client = new this.clientModel({
      ...createClientDto,
      userId: new Types.ObjectId(userId),
    });
    return client.save();
  }

  async findAll(userId: string): Promise<Client[]> {
    return this.clientModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(userId: string, id: string): Promise<Client> {
    const client = await this.clientModel.findById(id).exec();
    
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.userId.toString() !== userId) {
      throw new ForbiddenException('You do not have access to this client');
    }

    return client;
  }

  async update(userId: string, id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(userId, id);

    Object.assign(client, updateClientDto);
    return client.save();
  }

  async remove(userId: string, id: string): Promise<void> {
    const client = await this.findOne(userId, id);
    await client.deleteOne();
  }
}
