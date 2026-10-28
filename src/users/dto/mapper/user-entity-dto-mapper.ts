import { User } from '../../user.entity';
import { UserResponseDto } from '../user-response.dto';

export class UserEntityDtoMapper {
  public static userToResponseDto(user: User): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      enabled: user.enabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
