package ma.nafura.erp.config;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@RequiredArgsConstructor
public class DemoSeedRuntimeGuardAspect {

    private final DemoSeedProperties demoSeedProperties;

    @Around("execution(* *..*SeedService.seedIfEmpty(..))")
    public Object guardRuntimeSeed(ProceedingJoinPoint joinPoint) throws Throwable {
        if (!demoSeedProperties.isRuntimeSeedEnabled()) {
            return null;
        }
        return joinPoint.proceed();
    }
}
