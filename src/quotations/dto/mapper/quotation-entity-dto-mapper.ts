import { QuotationResponseDto } from '../quotation-response.dto';
import { ItemQuotationResponseDto } from '../item-quotation-response.dto';
import { Quotation } from '../../quotation.entity';

export class QuotationEntityDtoMapper {
  public static quotationEntityToQuotationResponseDto(quotation: Quotation): QuotationResponseDto {
    const dto = new QuotationResponseDto();
    dto.id = quotation.id;
    dto.currency = quotation.currency;
    dto.totalAmount = quotation.totalAmount;
    dto.createdAt = quotation.createdAt.toISOString();
    if (quotation.quotationItems) {
      dto.items = quotation.quotationItems.map(quotationItem => {
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
}
