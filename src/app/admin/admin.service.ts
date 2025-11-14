import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../models/user.models';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  // 🟢 Get all users
  async getAllUsers() {
    const users = await this.userModel.find({}, { password: 0, __v: 0 });
    return {
      success: true,
      count: users.length,
      data: users,
    };
  }

  // 🟢 Get single user by ID
  async getUserById(id: string) {
    const user = await this.userModel.findById(id, { password: 0, __v: 0 });
    if (!user) throw new NotFoundException('User not found');
    return { success: true, data: user };
  }

  // 🟡 Update user info (role, email, etc.)
  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true, projection: { password: 0 } })
      .exec();

    if (!user) throw new NotFoundException('User not found');

    return { success: true, message: 'User updated successfully', data: user };
  }

  // 🔴 Delete user
  async deleteUser(id: string) {
    const user = await this.userModel.findByIdAndDelete(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return { success: true, message: 'User deleted successfully' };
  }
}
