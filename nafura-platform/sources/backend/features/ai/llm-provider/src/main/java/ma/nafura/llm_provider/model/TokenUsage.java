package ma.nafura.platform.ai.llm.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TokenUsage {
    private Long inputTokens;
    private Long outputTokens;
    private Long totalTokens;
    private Boolean estimated;

    public TokenUsage(Long inputTokens, Long outputTokens, Long totalTokens, Boolean estimated) {
        this.inputTokens = inputTokens;
        this.outputTokens = outputTokens;
        this.totalTokens = totalTokens;
        this.estimated = estimated != null ? estimated : false;
    }
}

