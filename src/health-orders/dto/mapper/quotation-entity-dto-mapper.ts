import { QuotationResponseDto } from '../quotation-response.dto';
import { ItemQuotationResponseDto } from '../item-quotation-response.dto';
import { HealthOrderItem } from '../../health-order-item.entity';
import { ItemQuotationRequestDto } from '../item-quotation-request.dto';
import { HealthOrder } from '../../health-order.entity';

export class QuotationEntityDtoMapper {
  public static quotationEntityToQuotationResponseDto(quotation: HealthOrder): QuotationResponseDto {
    const dto = new QuotationResponseDto();
    dto.id = quotation.id;
    dto.currency = quotation.currency;
    dto.totalAmount = quotation.totalAmount;
    dto.createdAt = quotation.createdAt.toISOString();
    if (quotation.healthOrderItems) {
      dto.items = quotation.healthOrderItems.map(quotationItem => {
        const itemDto = new ItemQuotationResponseDto();
        itemDto.name = quotationItem.name;
        itemDto.itemCount = quotationItem.itemCount;
        itemDto.code = quotationItem.code;
        itemDto.unitPrice = quotationItem.unitPrice.toString();
        itemDto.totalPrice = (quotationItem.unitPrice * itemDto.itemCount).toString();
        return itemDto;
      });
    }

    return dto;
  }

  public static quotationItemRequestDtoToQuotationItemDto(
    itemDto: ItemQuotationRequestDto,
    itemIndex = 0,
  ): HealthOrderItem {
    const item = new HealthOrderItem();
    item.id = itemIndex;
    item.name = itemDto.name;
    item.code = itemDto.code;
    item.unitPrice = Number(itemDto.unitPrice); //TODO: Transform to BigDecimal
    item.itemCount = itemDto.itemCount;
    return item;
  }
}
