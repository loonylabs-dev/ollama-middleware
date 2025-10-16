import { CleaningRecipe } from '../types/recipe.types';
import { Recipe } from '../core/recipe-builder';
import { Conditions } from '../core/conditions';
import { Detectors } from '../operations/detectors';
import { Fixers } from '../operations/fixers';

export class RecipeTemplates {
  static conservative(): CleaningRecipe {
    return Recipe.conservative()
      .checkpoint('start')
      .use(Detectors.controlCharacter())
      .use(Detectors.missingComma())
      .use(Detectors.structural())
      .when(Conditions.hasDetection('control_character'))
        .use(Fixers.controlCharacter())
      .validate()
      .when(Conditions.and(
        Conditions.isInvalid(),
        Conditions.hasDetection('missing_comma')
      ))
        .use(Fixers.missingComma())
      .validate()
      .orFallback(Fixers.controlCharacter())
      .configure({
        maxExecutionTime: 5000,
        targetConfidence: 0.8,
        continueOnError: false
      })
      .build();
  }

  static aggressive(): CleaningRecipe {
    return Recipe.aggressive()
      .checkpoint('original')
      .when(Conditions.hasMarkdownCode())
        .use(Fixers.markdownExtractor())
      .when(Conditions.hasThinkTags())
        .use(Fixers.thinkTagExtractor())
      .validate()
      .when(Conditions.isValid())
        .checkpoint('extracted_success')
      .when(Conditions.isInvalid())
        .sequence(
          Detectors.controlCharacter(),
          Detectors.missingComma(),
          Detectors.structural()
        )
      .when(Conditions.isInvalid())
        .tryBest(
          Fixers.controlCharacter(),
          Fixers.missingComma(),
          Fixers.structuralRepair()
        )
      .validate()
      .when(Conditions.isInvalid())
        .rollbackTo('original')
        .sequence(
          Fixers.controlCharacter(),
          Fixers.missingComma(),
          Fixers.structuralRepair()
        )
      .validate()
      .orFallback(Fixers.structuralRepair())
      .configure({
        maxExecutionTime: 15000,
        targetConfidence: 0.6,
        continueOnError: true
      })
      .build();
  }

  static adaptive(): CleaningRecipe {
    return Recipe.adaptive()
      .checkpoint('start')
      .validate()
      .when(Conditions.isValid())
        .checkpoint('already_valid')
      .when(Conditions.isInvalid())
        .sequence(
          Detectors.markdownBlock(),
          Detectors.thinkTag(),
          Detectors.controlCharacter(),
          Detectors.missingComma(),
          Detectors.structural()
        )
      .when(Conditions.or(
        Conditions.hasDetection('markdown_code_block'),
        Conditions.hasDetection('think_tag')
      ))
        .tryBest(
          Fixers.markdownExtractor(),
          Fixers.thinkTagExtractor()
        )
      .validate()
      .when(Conditions.isInvalid())
        .checkpoint('before_fixes')
        .sequence(
          Fixers.controlCharacter(),
          Fixers.missingComma()
        )
      .validate()
      .when(Conditions.and(
        Conditions.isInvalid(),
        Conditions.hasDetection('unbalanced_braces')
      ))
        .use(Fixers.structuralRepair())
      .validate()
      .when(Conditions.and(
        Conditions.isInvalid(),
        Conditions.hasDetection('control_character')
      ))
        .orFallback(Fixers.controlCharacter())
      .when(Conditions.and(
        Conditions.isInvalid(),
        Conditions.not(Conditions.hasDetection('control_character'))
      ))
        .orFallback(Fixers.missingComma())
      .configure({
        maxExecutionTime: 10000,
        targetConfidence: 0.75,
        continueOnError: true,
        optimizeOrder: true
      })
      .build();
  }

  /**
   * Helper method to get template by name
   */
  static getTemplate(name: 'conservative' | 'aggressive' | 'adaptive'): CleaningRecipe {
    switch (name) {
      case 'conservative':
        return this.conservative();
      case 'aggressive':
        return this.aggressive();
      case 'adaptive':
        return this.adaptive();
      default:
        return this.adaptive();
    }
  }
}
