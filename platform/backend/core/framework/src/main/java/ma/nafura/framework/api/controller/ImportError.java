package ma.nafura.platform.framework.api.controller;

/**
 * Row-level error from CSV import (row number, field, message).
 */
public record ImportError(int row, String field, String message) {}
