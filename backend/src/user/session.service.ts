import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<Session>,
  ) {}

  async createSession(userId: Types.ObjectId, userAgent: string, ipAddress: string, sessionToken: string) {
    return this.sessionModel.create({ user: userId, userAgent, ipAddress, sessionToken });
  }

  async getUserSessions(userId: Types.ObjectId) {
    return this.sessionModel.find({ user: userId, revoked: false }).sort({ createdAt: -1 });
  }

  async revokeSession(sessionId: string, userId: Types.ObjectId) {
    return this.sessionModel.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { revoked: true, revokedAt: new Date() },
      { new: true },
    );
  }

  async revokeAllSessions(userId: Types.ObjectId, exceptSessionId?: string) {
    const filter: any = { user: userId, revoked: false };
    if (exceptSessionId) filter._id = { $ne: exceptSessionId };
    return this.sessionModel.updateMany(filter, { revoked: true, revokedAt: new Date() });
  }
}
