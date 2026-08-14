package ma.nafura.rh.service;

import ma.nafura.rh.api.dto.PointageBatchConflictDto;
import lombok.Getter;

@Getter
public class PointageBatchDuplicateException extends RuntimeException {

    private final PointageBatchConflictDto conflict;

    public PointageBatchDuplicateException(PointageBatchConflictDto conflict) {
        super(conflict.getMessage());
        this.conflict = conflict;
    }
}
