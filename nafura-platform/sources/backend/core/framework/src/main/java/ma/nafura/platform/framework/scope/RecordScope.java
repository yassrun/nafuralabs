package ma.nafura.platform.framework.scope;

/**
 * How a record sits in a data scope, from {@code scope} in its descriptor.
 * A node can receive a grant; {@code parent} walks the same record type.
 * A reference ({@code of} + {@code field}) belongs to the node that field points at.
 */
public record RecordScope(boolean node, String parent, String of, String field) {
}
