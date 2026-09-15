package ma.nafura.platform.framework.listing;

import org.springframework.data.domain.Sort;

public record ListingSort(String field, Sort.Direction direction) {}
