using System;

namespace BuildingBlocks.Domain;

public class Result<T>
{
    public T Value { get; }
    public string Error { get; }
    public bool IsSuccess => Error == null;
    public bool IsFailure => !IsSuccess;

    protected Result(T value, string error)
    {
        Value = value;
        Error = error;
    }

    public static Result<T> Success(T value) => new Result<T>(value, null);
    public static Result<T> Failure(string error) => new Result<T>(default, error);
}

public class Result
{
    public string Error { get; }
    public bool IsSuccess => Error == null;
    public bool IsFailure => !IsSuccess;

    protected Result(string error)
    {
        Error = error;
    }

    public static Result Success() => new Result(null);
    public static Result Failure(string error) => new Result(error);
}
