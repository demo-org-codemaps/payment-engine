import { DefaultNamingStrategy } from 'typeorm';
import { camelCase, titleCase } from 'typeorm/util/StringUtils';

export class TypeOrmNamingStrategy extends DefaultNamingStrategy {
  tableName(className, customName) {
    return customName || className;
  }

  columnName(propertyName, customName, embeddedPrefixes) {
    return camelCase(embeddedPrefixes.join('_')) + (customName || camelCase(propertyName));
  }

  relationName(propertyName) {
    return titleCase(propertyName);
  }

  joinColumnName(relationName, referencedColumnName) {
    return camelCase(relationName + '_' + referencedColumnName);
  }

  joinTableName(firstTableName, secondTableName) {
    return titleCase(firstTableName + '_' + secondTableName);
  }

  joinTableColumnName(tableName, propertyName, columnName) {
    return camelCase(tableName + '_' + (columnName || propertyName));
  }

  classTableInheritanceParentColumnName(parentTableName, parentTableIdPropertyName) {
    return camelCase(parentTableName + '_' + parentTableIdPropertyName);
  }
}
