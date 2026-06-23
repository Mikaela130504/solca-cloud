from datetime import date, datetime


def normalize_record(record):
    if record is None:
        return None
    return {key: normalize_value(value) for key, value in dict(record).items()}


def normalize_records(records):
    return [normalize_record(record) for record in records]


def normalize_value(value):
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value

