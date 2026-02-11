import { IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cancellation method determines when/how the subscription is canceled
 * 
 * - IMMEDIATE: Cancel subscription right now, refund for unused period
 * - AT_PERIOD_END: Keep access until renewal date, no refund
 * - PAUSE: Temporarily pause (future feature)
 */
export enum CancellationMethod {
  IMMEDIATE = 'immediate',
  AT_PERIOD_END = 'at_period_end',
}

/**
 * Refund strategy for immediate cancellations
 */
export enum RefundStrategy {
  FULL_PRORATED = 'full_prorated', // Full refund minus usage
  ACCOUNT_CREDIT = 'account_credit', // Credit to account (no refund)
  NO_REFUND = 'no_refund', // Non-refundable
}

/**
 * Reason for cancellation - helps with analytics
 */
export enum CancellationReason {
  TOO_EXPENSIVE = 'too_expensive',
  SWITCHING_TO_COMPETITOR = 'switching_to_competitor',
  MISSING_FEATURES = 'missing_features',
  POOR_QUALITY = 'poor_quality',
  TEMPORARY_PAUSE = 'temporary_pause',
  NOT_USING = 'not_using',
  OTHER = 'other',
}

/**
 * Request DTO for canceling subscription
 * 
 * Example:
 * {
 *   "method": "immediate",
 *   "refundStrategy": "full_prorated",
 *   "reason": "too_expensive",
 *   "feedback": "Great app but pricing is too high for my current needs"
 * }
 */
export class CancelSubscriptionDto {
  @ApiProperty({
    enum: CancellationMethod,
    description: 'When to cancel subscription',
    example: CancellationMethod.IMMEDIATE,
  })
  @IsEnum(CancellationMethod)
  method: CancellationMethod = CancellationMethod.IMMEDIATE;

  @ApiProperty({
    enum: RefundStrategy,
    description: 'Refund strategy for immediate cancellations',
    example: RefundStrategy.FULL_PRORATED,
  })
  @IsEnum(RefundStrategy)
  refundStrategy: RefundStrategy = RefundStrategy.FULL_PRORATED;

  @ApiPropertyOptional({
    enum: CancellationReason,
    description: 'Reason for cancellation (for analytics)',
    example: CancellationReason.TOO_EXPENSIVE,
  })
  @IsOptional()
  @IsEnum(CancellationReason)
  reason?: CancellationReason;

  @ApiPropertyOptional({
    description: 'User feedback or additional comments',
    example: 'Great app but pricing is too high for my current needs',
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  feedback?: string;
}

/**
 * Response DTO for cancellation confirmation
 */
export class CancellationConfirmationDto {
  @ApiProperty({ description: 'Subscription ID' })
  subscriptionId: string;

  @ApiProperty({
    description: 'When cancellation takes effect',
    example: '2026-03-10T00:00:00Z',
  })
  cancellationDate: Date;

  @ApiProperty({
    description: 'Final access date (for AT_PERIOD_END)',
    example: '2026-03-10T23:59:59Z',
  })
  accessUntilDate?: Date;

  @ApiProperty({
    description: 'Refund amount (for IMMEDIATE with refund)',
    example: 25.50,
  })
  refundAmount?: number;

  @ApiProperty({
    description: 'Refund currency',
    example: 'KWD',
  })
  refundCurrency?: string;

  @ApiProperty({
    description: 'Refund status',
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  refundStatus?: string;

  @ApiProperty({
    description: 'Human-readable message',
    example: 'Your subscription will be canceled at the end of your billing period.',
  })
  message: string;
}

/**
 * DTO for getting cancellation preview/info
 */
export class CancellationPreviewDto {
  @ApiProperty({
    enum: CancellationMethod,
    description: 'Planned cancellation method',
  })
  method: CancellationMethod;

  @ApiProperty({
    description: 'Current plan name',
    example: 'Pro',
  })
  currentPlan: string;

  @ApiProperty({
    description: 'Days remaining in current billing period',
    example: 15,
  })
  daysRemaining: number;

  @ApiProperty({
    description: 'Date current billing period ends',
    example: '2026-03-10T00:00:00Z',
  })
  periodEndDate: Date;

  @ApiProperty({
    description: 'Estimated refund amount',
    example: 25.50,
  })
  estimatedRefundAmount: number;

  @ApiProperty({
    description: 'Refund currency',
    example: 'KWD',
  })
  currency: string;

  @ApiProperty({
    description: 'Message explaining refund logic',
    example: 'You will receive a refund of 25.50 KWD for 15 unused days',
  })
  refundMessage: string;
}
